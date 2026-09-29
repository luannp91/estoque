const db = require("../config/database");

class UsuarioRepository {
    // ==================== LISTAGEM ====================
    listar({ busca = "", papel = "", ativo = "", pagina = 1, limite = 10, ordenar = "nome", ordem = "asc" } = {}) {
        const where = ["1=1"];
        const params = [];

        if (busca) {
            where.push("(nome LIKE ? OR email LIKE ?)");
            params.push(`%${busca}%`, `%${busca}%`);
        }
        if (papel) {
            where.push("papel = ?");
            params.push(papel);
        }
        if (ativo === "true" || ativo === true) {
            where.push("ativo = 1");
        } else if (ativo === "false" || ativo === false) {
            where.push("ativo = 0");
        }

        const whereSql = `WHERE ${where.join(" AND ")}`;

        const total = db.prepare(`SELECT COUNT(*) AS total FROM usuarios ${whereSql}`).get(...params).total;

        const colunasPermitidas = ["id", "nome", "email", "papel", "criado_em", "ultimo_login"];
        const colOrdenar = colunasPermitidas.includes(ordenar) ? ordenar : "nome";
        const dir = ordem === "desc" ? "DESC" : "ASC";

        const offset = (pagina - 1) * limite;

        const linhas = db
            .prepare(
                `
            SELECT id, nome, email, papel, ativo, ultimo_login, criado_em, totp_ativo
            FROM usuarios
            ${whereSql}
            ORDER BY ${colOrdenar} ${dir}
            LIMIT ? OFFSET ?
        `
            )
            .all(...params, limite, offset);

        return {
            itens: linhas,
            total,
            pagina,
            totalPaginas: Math.max(1, Math.ceil(total / limite))
        };
    }

    // ==================== BUSCAS ====================
    porId(id) {
        return (
            db
                .prepare(
                    `
            SELECT id, nome, email, papel, ativo, ultimo_login, criado_em, totp_ativo
            FROM usuarios WHERE id = ?
        `
                )
                .get(id) || null
        );
    }

    /** Retorna TODOS os campos (inclui senha_hash e totp_secret) */
    porIdCompleto(id) {
        return db.prepare("SELECT * FROM usuarios WHERE id = ?").get(id) || null;
    }

    porEmail(email) {
        return db.prepare("SELECT * FROM usuarios WHERE email = ?").get(email) || null;
    }

    // ==================== CRUD ====================
    criar({ nome, email, senha_hash, papel }) {
        const info = db
            .prepare(
                `
            INSERT INTO usuarios (nome, email, senha_hash, papel, ativo)
            VALUES (?, ?, ?, ?, 1)
        `
            )
            .run(nome, email, senha_hash, papel);
        return this.porId(info.lastInsertRowid);
    }

    atualizar(id, { nome, email, papel, ativo }) {
        db.prepare(
            `
            UPDATE usuarios
            SET nome = ?, email = ?, papel = ?, ativo = ?
            WHERE id = ?
        `
        ).run(nome, email, papel, ativo ? 1 : 0, id);
        return this.porId(id);
    }

    remover(id) {
        db.prepare("DELETE FROM usuarios WHERE id = ?").run(id);
    }

    // ==================== SENHA ====================
    alterarSenha(id, senha_hash) {
        db.prepare(
            `
            UPDATE usuarios
            SET senha_hash = ?,
                senha_alterada_em = CURRENT_TIMESTAMP,
                tentativas_falhas = 0,
                bloqueado_ate = NULL
            WHERE id = ?
        `
        ).run(senha_hash, id);
    }

    // ==================== LOCKOUT ====================

    incrementarTentativasFalhas(id) {
        db.prepare(
            `
            UPDATE usuarios
            SET tentativas_falhas = tentativas_falhas + 1
            WHERE id = ?
        `
        ).run(id);

        const row = db.prepare("SELECT tentativas_falhas FROM usuarios WHERE id = ?").get(id);
        return row ? row.tentativas_falhas : 0;
    }

    resetarTentativas(id) {
        db.prepare(
            `
            UPDATE usuarios
            SET tentativas_falhas = 0, bloqueado_ate = NULL
            WHERE id = ?
        `
        ).run(id);
    }

    /**
     * Bloqueia a conta por N minutos.
     * Aceita (id, minutos) ou (id, { minutos }).
     */
    bloquearPorMinutos(id, minutosOuOpts = 15) {
        const minutos = typeof minutosOuOpts === "object" ? minutosOuOpts.minutos || 15 : minutosOuOpts;

        db.prepare(
            `
            UPDATE usuarios
            SET bloqueado_ate = datetime('now', ?)
            WHERE id = ?
        `
        ).run(`+${minutos} minutes`, id);
    }

    /** Alias para compatibilidade */
    bloquear(id, minutos = 15) {
        return this.bloquearPorMinutos(id, minutos);
    }

    registrarLogin(id, ip) {
        db.prepare(
            `
            UPDATE usuarios
            SET ultimo_login = CURRENT_TIMESTAMP,
                ultimo_login_ip = ?,
                tentativas_falhas = 0,
                bloqueado_ate = NULL
            WHERE id = ?
        `
        ).run(ip || null, id);
    }

    // ==================== 2FA ====================

    /**
     * Atualiza campos de 2FA.
     * Aceita múltiplos formatos:
     *   (id, secret, ativo)            ← usado pelo authService
     *   (id, { totp_secret, totp_ativo })
     *   (id, null, false)              ← desativar
     */
    atualizar2FA(id, dados, ativoArg) {
        let totp_secret;
        let totp_ativo;

        // Formato 1: (id, string, boolean) — string OU null + 3º argumento
        if (typeof dados === "string" || dados === null) {
            totp_secret = dados;
            if (ativoArg !== undefined) {
                totp_ativo = ativoArg;
            }
        }
        // Formato 2: (id, { totp_secret, totp_ativo })
        else if (dados && typeof dados === "object") {
            if ("totp_secret" in dados) totp_secret = dados.totp_secret;
            if ("totp_ativo" in dados) totp_ativo = dados.totp_ativo;
        }
        // Formato 3: (id) — não faz nada
        else {
            return this.porId(id);
        }

        const sets = [];
        const params = [];

        if (totp_secret !== undefined) {
            sets.push("totp_secret = ?");
            params.push(totp_secret);
        }
        if (totp_ativo !== undefined) {
            sets.push("totp_ativo = ?");
            params.push(totp_ativo ? 1 : 0);
        }

        if (sets.length === 0) return this.porId(id);

        params.push(id);
        db.prepare(`UPDATE usuarios SET ${sets.join(", ")} WHERE id = ?`).run(...params);
        return this.porId(id);
    }

    /** Atalho: ativa 2FA */
    ativar2FA(id, secret) {
        db.prepare(
            `
            UPDATE usuarios
            SET totp_secret = ?, totp_ativo = 1
            WHERE id = ?
        `
        ).run(secret, id);
    }

    /** Atalho: desativa 2FA */
    desativar2FA(id) {
        db.prepare(
            `
            UPDATE usuarios
            SET totp_secret = NULL, totp_ativo = 0
            WHERE id = ?
        `
        ).run(id);
    }

    // ==================== CONTADORES ====================
    contarAdminsAtivos() {
        return db.prepare("SELECT COUNT(*) AS t FROM usuarios WHERE papel = 'admin' AND ativo = 1").get().t;
    }

    contarPorPapel(papel) {
        return db.prepare("SELECT COUNT(*) AS t FROM usuarios WHERE papel = ? AND ativo = 1").get(papel).t;
    }

    // ==================== ESTATÍSTICAS ====================
    estatisticas() {
        const r = db
            .prepare(
                `
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN ativo = 1 THEN 1 ELSE 0 END) AS ativos,
                SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) AS inativos,
                SUM(CASE WHEN papel = 'admin' THEN 1 ELSE 0 END) AS admins,
                SUM(CASE WHEN papel = 'operador' THEN 1 ELSE 0 END) AS operadores,
                SUM(CASE WHEN papel = 'super_admin' THEN 1 ELSE 0 END) AS super_admins,
                SUM(CASE WHEN totp_ativo = 1 THEN 1 ELSE 0 END) AS com_2fa
            FROM usuarios
        `
            )
            .get();

        return {
            total_usuarios: r.total,
            total: r.total,
            ativos: r.ativos,
            inativos: r.inativos,
            admins: r.admins,
            operadores: r.operadores,
            super_admins: r.super_admins,
            com_2fa: r.com_2fa
        };
    }
}

module.exports = UsuarioRepository;
