const db = require("../config/database");

class LogRepository {
    constructor() {
        this.insert = db.prepare(`
            INSERT INTO logs_sistema
            (usuario_id, usuario_nome, usuario_papel, acao, entidade, entidade_id, descricao, ip, user_agent, nivel)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
    }

    registrar(log) {
        const info = this.insert.run(
            log.usuario_id || null,
            log.usuario_nome || null,
            log.usuario_papel || null,
            log.acao,
            log.entidade || null,
            log.entidade_id || null,
            log.descricao || null,
            log.ip || null,
            log.user_agent || null,
            log.nivel || "info"
        );
        return info.lastInsertRowid;
    }

    listar({ busca, usuario_id, acao, entidade, nivel, data_inicio, data_fim, pagina, limite }) {
        const where = [];
        const params = [];

        if (busca) {
            where.push("(acao LIKE ? OR descricao LIKE ? OR usuario_nome LIKE ?)");
            params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
        }
        if (usuario_id) {
            where.push("usuario_id = ?");
            params.push(usuario_id);
        }
        if (acao) {
            where.push("acao = ?");
            params.push(acao);
        }
        if (entidade) {
            where.push("entidade = ?");
            params.push(entidade);
        }
        if (nivel) {
            where.push("nivel = ?");
            params.push(nivel);
        }
        if (data_inicio) {
            where.push("criado_em >= ?");
            params.push(data_inicio);
        }
        if (data_fim) {
            where.push("criado_em <= ?");
            params.push(data_fim);
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const total = db.prepare(`SELECT COUNT(*) AS total FROM logs_sistema ${whereSql}`).get(...params).total;
        const offset = (pagina - 1) * limite;

        const itens = db
            .prepare(
                `
            SELECT * FROM logs_sistema
            ${whereSql}
            ORDER BY criado_em DESC
            LIMIT ? OFFSET ?
        `
            )
            .all(...params, limite, offset);

        return { itens, total, pagina, totalPaginas: Math.max(1, Math.ceil(total / limite)) };
    }

    estatisticas() {
        return db
            .prepare(
                `
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN nivel = 'info' THEN 1 ELSE 0 END) AS info,
                SUM(CASE WHEN nivel = 'warn' THEN 1 ELSE 0 END) AS warn,
                SUM(CASE WHEN nivel = 'error' THEN 1 ELSE 0 END) AS error,
                SUM(CASE WHEN criado_em >= datetime('now', '-1 day') THEN 1 ELSE 0 END) AS ultimas_24h,
                SUM(CASE WHEN criado_em >= datetime('now', '-7 day') THEN 1 ELSE 0 END) AS ultimos_7d
            FROM logs_sistema
        `
            )
            .get();
    }

    acoesDistintas() {
        return db
            .prepare("SELECT DISTINCT acao FROM logs_sistema ORDER BY acao")
            .all()
            .map((r) => r.acao);
    }

    entidadesDistintas() {
        return db
            .prepare("SELECT DISTINCT entidade FROM logs_sistema WHERE entidade IS NOT NULL ORDER BY entidade")
            .all()
            .map((r) => r.entidade);
    }

    limparMaisAntigos(diasRetencao = 90) {
        return db.prepare("DELETE FROM logs_sistema WHERE criado_em < datetime('now', ?)").run(`-${diasRetencao} day`)
            .changes;
    }
}

module.exports = LogRepository;
