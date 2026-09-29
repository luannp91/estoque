const fs = require("fs");
const Database = require("../config/sqliteShim");
const db = require("../config/database");
const backupService = require("./backupService");

const TABELAS_ESPERADAS = ["usuarios", "categorias", "produtos", "movimentacoes"];
const ORDEM_INSERT = ["usuarios", "categorias", "produtos", "movimentacoes"];
const ORDEM_DELETE = ["movimentacoes", "produtos", "categorias", "usuarios"];

/**
 * Valida um arquivo .db antes de restaurar.
 * Retorna contagens por tabela se for válido.
 */
function validar(caminho) {
    if (!fs.existsSync(caminho)) {
        throw _erro("Arquivo de backup não encontrado.", 400);
    }

    let testDb;
    try {
        testDb = new Database(caminho, { readonly: true, fileMustExist: true });
    } catch {
        throw _erro("Arquivo inválido: não é um banco SQLite válido.", 400);
    }

    try {
        const integridade = testDb.pragma("integrity_check", { simple: true });
        if (integridade !== "ok") {
            throw _erro(`Banco corrompido: ${integridade}`, 400);
        }

        const tabelas = testDb
            .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
            .all()
            .map((t) => t.name);

        for (const t of TABELAS_ESPERADAS) {
            if (!tabelas.includes(t)) {
                throw _erro(`Tabela "${t}" não encontrada no arquivo enviado.`, 400);
            }
        }

        const counts = {};
        for (const t of TABELAS_ESPERADAS) {
            counts[t] = testDb.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
        }

        return { tabelas, counts };
    } finally {
        testDb.close();
    }
}

/**
 * Restaura o banco a partir de um arquivo .db (já descriptografado).
 * Faz backup automático do estado atual antes de substituir.
 */
function restaurar(caminho) {
    const info = validar(caminho);

    // 1. Backup de segurança do estado atual
    const backupPreRestore = backupService.criarBackupManual();

    // 2. Abre o backup para leitura
    const origem = new Database(caminho, { readonly: true, fileMustExist: true });

    try {
        db.pragma("foreign_keys = OFF");

        const trx = db.transaction(() => {
            for (const t of ORDEM_DELETE) db.exec(`DELETE FROM ${t}`);

            for (const tabela of ORDEM_INSERT) {
                const linhas = origem.prepare(`SELECT * FROM ${tabela}`).all();
                if (!linhas.length) continue;

                const colunas = Object.keys(linhas[0]);
                const placeholders = colunas.map(() => "?").join(", ");
                const stmt = db.prepare(`INSERT INTO ${tabela} (${colunas.join(", ")}) VALUES (${placeholders})`);

                for (const linha of linhas) {
                    const valores = colunas.map((c) => linha[c]);
                    stmt.run(...valores);
                }
            }

            const sequencias = db.prepare("SELECT name FROM sqlite_master WHERE name = ?").get("sqlite_sequence");
            if (sequencias) {
                db.exec(`
                    UPDATE sqlite_sequence SET seq = (SELECT COALESCE(MAX(id), 0) FROM usuarios) WHERE name = 'usuarios';
                    UPDATE sqlite_sequence SET seq = (SELECT COALESCE(MAX(id), 0) FROM categorias) WHERE name = 'categorias';
                    UPDATE sqlite_sequence SET seq = (SELECT COALESCE(MAX(id), 0) FROM produtos) WHERE name = 'produtos';
                    UPDATE sqlite_sequence SET seq = (SELECT COALESCE(MAX(id), 0) FROM movimentacoes) WHERE name = 'movimentacoes';
                `);
            }
        });

        trx();
    } finally {
        origem.close();
        db.pragma("foreign_keys = ON");
    }

    return {
        ...info,
        backup_seguranca: backupPreRestore.nome,
        restaurado_em: new Date()
    };
}

function _erro(msg, status) {
    const e = new Error(msg);
    e.status = status;
    return e;
}

module.exports = { validar, restaurar };
