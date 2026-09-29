const ProdutoRepository = require("../repositories/produtoRepository");
const MovimentacaoRepository = require("../repositories/movimentacaoRepository");
const db = require("../config/database");

class RelatorioService {
    constructor() {
        // ✅ Usa os repositories diretamente — não depende de métodos do EstoqueService
        this.produtos = new ProdutoRepository();
        this.movs = new MovimentacaoRepository();
    }

    // ==================== RESUMO GERAL ====================
    resumoGeral() {
        return this.produtos.estatisticas();
    }

    // ==================== ESTOQUE BAIXO ====================
    estoqueBaixo() {
        return this.produtos.listar({
            estoque_baixo: "true",
            apenas_ativos: "true",
            pagina: 1,
            limite: 1000,
            ordenar: "quantidade",
            ordem: "asc"
        }).itens;
    }

    // ==================== TOP PRODUTOS ====================
    topProdutos(limite = 10) {
        return this.produtos.topPorValor(limite);
    }

    // ==================== DISTRIBUIÇÃO POR CATEGORIA ====================
    distribuicaoCategoria() {
        return this.produtos.porCategoria();
    }

    // ==================== MOVIMENTAÇÕES POR PERÍODO ====================
    movimentacoesPorPeriodo(inicio, fim) {
        const i = inicio || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        const f = fim || new Date().toISOString().slice(0, 10);
        return {
            periodo: { inicio: i, fim: f },
            resumo: this.movs.resumoPeriodo(`${i} 00:00:00`, `${f} 23:59:59`)
        };
    }

    // ==================== MOVIMENTAÇÕES POR DIA ====================
    movsPorDia(inicio, fim) {
        const i = inicio || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        const f = fim || new Date().toISOString().slice(0, 10);

        return db
            .prepare(
                `
            SELECT
                DATE(criado_em) AS dia,
                SUM(CASE WHEN tipo = 'entrada' THEN quantidade ELSE 0 END) AS entradas,
                SUM(CASE WHEN tipo = 'saida'   THEN quantidade ELSE 0 END) AS saidas
            FROM movimentacoes
            WHERE criado_em BETWEEN ? AND ?
            GROUP BY DATE(criado_em)
            ORDER BY dia ASC
        `
            )
            .all(`${i} 00:00:00`, `${f} 23:59:59`);
    }
}

module.exports = RelatorioService;
