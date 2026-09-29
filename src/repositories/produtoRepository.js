const db = require("../config/database");
const Produto = require("../models/Produto");

class ProdutoRepository {
    constructor() {
        this.baseSelect = `
            SELECT p.*, c.nome AS categoria_nome
            FROM produtos p
            LEFT JOIN categorias c ON c.id = p.categoria_id
        `;
    }

    // ==================== CRUD ====================
    criar({ nome, sku, descricao, preco, quantidade, estoque_minimo, categoria_id }) {
        const info = db
            .prepare(
                `
            INSERT INTO produtos (nome, sku, descricao, preco, quantidade, estoque_minimo, categoria_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `
            )
            .run(nome, sku || null, descricao || null, preco, quantidade, estoque_minimo, categoria_id || null);
        return this.porId(info.lastInsertRowid);
    }

    atualizar(id, dados) {
        db.prepare(
            `
            UPDATE produtos SET
                nome = ?, sku = ?, descricao = ?, preco = ?,
                estoque_minimo = ?, categoria_id = ?, ativo = ?,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?
        `
        ).run(
            dados.nome,
            dados.sku || null,
            dados.descricao || null,
            dados.preco,
            dados.estoque_minimo,
            dados.categoria_id || null,
            dados.ativo ? 1 : 0,
            id
        );
        return this.porId(id);
    }

    atualizarQuantidade(id, quantidade) {
        db.prepare("UPDATE produtos SET quantidade = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?").run(
            quantidade,
            id
        );
        return this.porId(id);
    }

    marcarComoDeletado(id, usuarioId) {
        db.prepare(
            `
            UPDATE produtos SET
                deletado_em = CURRENT_TIMESTAMP,
                deletado_por = ?
            WHERE id = ?
        `
        ).run(usuarioId || null, id);
        return this.porId(id);
    }

    restaurar(id) {
        db.prepare(
            `
            UPDATE produtos SET deletado_em = NULL, deletado_por = NULL
            WHERE id = ?
        `
        ).run(id);
        return this.porId(id);
    }

    purgarAntigos(dias = 90) {
        return db
            .prepare(
                `
            DELETE FROM produtos
            WHERE deletado_em IS NOT NULL
              AND deletado_em < datetime('now', ?)
        `
            )
            .run(`-${dias} day`).changes;
    }

    esvaziarTudo() {
        return db.prepare("DELETE FROM produtos WHERE deletado_em IS NOT NULL").run().changes;
    }

    porId(id) {
        const row = db.prepare(`${this.baseSelect} WHERE p.id = ?`).get(id);
        return row ? new Produto(row) : null;
    }

    porSku(sku) {
        return db.prepare("SELECT * FROM produtos WHERE sku = ?").get(sku);
    }

    // ==================== LISTAGEM COM FILTROS ====================
    listar({ busca, categoria_id, estoque_baixo, apenas_ativos, ordenar, ordem, pagina, limite }) {
        const where = ["p.deletado_em IS NULL"];
        const params = [];

        // 🎯 Busca priorizada:
        // - "relevancia" ordena por campo que bateu primeiro (nome > sku > descricao)
        // - Mantém busca ampla (acha por características também)
        let orderByRelevancia = null;

        if (busca) {
            const termo = `%${busca}%`;

            // Filtra por qualquer um dos 3 campos
            where.push("(p.nome LIKE ? OR p.sku LIKE ? OR p.descricao LIKE ?)");
            params.push(termo, termo, termo);

            // 🎯 Ranking: nome (1) > sku (2) > descricao (3)
            orderByRelevancia = `
                CASE
                    WHEN p.nome LIKE ? THEN 1
                    WHEN p.sku LIKE ? THEN 2
                    ELSE 3
                END
            `;
        }

        if (categoria_id) {
            where.push("p.categoria_id = ?");
            params.push(categoria_id);
        }
        if (estoque_baixo === "true") where.push("p.quantidade <= p.estoque_minimo");
        if (apenas_ativos === "true") where.push("p.ativo = 1");

        const whereSql = `WHERE ${where.join(" AND ")}`;

        // Contagem (não precisa dos params de relevância)
        const total = db.prepare(`SELECT COUNT(*) AS total FROM produtos p ${whereSql}`).get(...params).total;

        // Ordenação
        const colunasPermitidas = ["id", "nome", "preco", "quantidade", "criado_em"];
        const colOrdenar = colunasPermitidas.includes(ordenar) ? ordenar : "nome";
        const dir = ordem === "desc" ? "DESC" : "ASC";

        const offset = (pagina - 1) * limite;

        // 🎯 Se há busca, ordena por relevância PRIMEIRO, depois pelo critério escolhido
        let orderSql;
        if (orderByRelevancia) {
            const termo = `%${busca}%`;
            orderSql = `ORDER BY ${orderByRelevancia}, p.${colOrdenar} ${dir}`;
            // Adiciona os params da relevância
            params.push(termo, termo);
        } else {
            orderSql = `ORDER BY p.${colOrdenar} ${dir}`;
        }

        const linhas = db
            .prepare(
                `
            ${this.baseSelect} ${whereSql}
            ${orderSql}
            LIMIT ? OFFSET ?
        `
            )
            .all(...params, limite, offset);

        return {
            itens: linhas.map((r) => new Produto(r)),
            total,
            pagina,
            totalPaginas: Math.max(1, Math.ceil(total / limite))
        };
    }

    listarLixeira({ pagina = 1, limite = 20 } = {}) {
        const total = db.prepare("SELECT COUNT(*) AS total FROM produtos WHERE deletado_em IS NOT NULL").get().total;

        const offset = (pagina - 1) * limite;
        const linhas = db
            .prepare(
                `
            ${this.baseSelect}
            WHERE p.deletado_em IS NOT NULL
            ORDER BY p.deletado_em DESC
            LIMIT ? OFFSET ?
        `
            )
            .all(limite, offset);

        return {
            itens: linhas.map((r) => new Produto(r)),
            total,
            pagina,
            totalPaginas: Math.max(1, Math.ceil(total / limite))
        };
    }

    estatisticas() {
        return db
            .prepare(
                `
            SELECT
                COUNT(*) AS total_produtos,
                COALESCE(SUM(quantidade), 0) AS total_itens,
                COALESCE(SUM(quantidade * preco), 0) AS valor_total,
                SUM(CASE WHEN quantidade <= estoque_minimo THEN 1 ELSE 0 END) AS estoque_baixo,
                SUM(CASE WHEN quantidade = 0 THEN 1 ELSE 0 END) AS sem_estoque
            FROM produtos
            WHERE ativo = 1 AND deletado_em IS NULL
        `
            )
            .get();
    }

    topPorValor(limite = 10) {
        const linhas = db
            .prepare(
                `
            ${this.baseSelect}
            WHERE p.ativo = 1 AND p.deletado_em IS NULL
            ORDER BY (p.preco * p.quantidade) DESC
            LIMIT ?
        `
            )
            .all(limite);
        return linhas.map((r) => new Produto(r));
    }

    porCategoria() {
        return db
            .prepare(
                `
            SELECT
                COALESCE(c.nome, 'Sem categoria') AS categoria,
                COUNT(p.id) AS total
            FROM produtos p
            LEFT JOIN categorias c ON c.id = p.categoria_id
            WHERE p.ativo = 1 AND p.deletado_em IS NULL
            GROUP BY c.nome
            ORDER BY total DESC
        `
            )
            .all();
    }
}

module.exports = ProdutoRepository;
