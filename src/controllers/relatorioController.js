const RelatorioService = require("../services/relatorioService");
const ExcelService = require("../services/excelService");
const ProdutoRepository = require("../repositories/produtoRepository");
const MovimentacaoRepository = require("../repositories/movimentacaoRepository");

const service = new RelatorioService();
const excelService = new ExcelService();
const produtoRepo = new ProdutoRepository();
const movRepo = new MovimentacaoRepository();

// ==================== DASHBOARD ====================
exports.dashboard = (req, res, next) => {
    try {
        res.json({
            resumo: service.resumoGeral(),
            estoqueBaixo: service.estoqueBaixo(),
            topProdutos: service.topProdutos(5),
            porCategoria: service.distribuicaoCategoria(),
            movimentacoes: service.movimentacoesPorPeriodo()
        });
    } catch (e) {
        next(e);
    }
};

// ==================== MOVIMENTAÇÕES ====================
exports.movimentacoesPeriodo = (req, res, next) => {
    try {
        res.json(service.movimentacoesPorPeriodo(req.query.inicio, req.query.fim));
    } catch (e) {
        next(e);
    }
};

// ==================== 🆕 RELATÓRIO COMPLETO ====================
exports.completo = (req, res, next) => {
    try {
        const inicio = req.query.inicio || null;
        const fim = req.query.fim || null;

        const produtos = produtoRepo.listar({
            pagina: 1,
            limite: 100000,
            ordenar: "nome",
            ordem: "asc"
        }).itens;

        const movimentacoes = movRepo.listar({
            pagina: 1,
            limite: 100000,
            data_inicio: inicio ? inicio + " 00:00:00" : null,
            data_fim: fim ? fim + " 23:59:59" : null
        }).itens;

        res.json({
            geradoEm: new Date().toISOString(),
            periodo: { inicio, fim },
            resumo: service.resumoGeral(),
            porCategoria: service.distribuicaoCategoria(),
            topProdutos: service.topProdutos(10),
            estoqueBaixo: service.estoqueBaixo(),
            movimentacoesResumo: service.movimentacoesPorPeriodo(inicio, fim).resumo,
            produtos,
            movimentacoes
        });
    } catch (e) {
        next(e);
    }
};

// ==================== EXPORTAR EXCEL ====================
exports.exportarExcel = async (req, res, next) => {
    try {
        const filtros = {
            inicio: req.query.inicio || null,
            fim: req.query.fim || null
        };

        const buffer = await excelService.gerarBuffer(filtros);

        const data = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
        const nome = `relatorio-estoque-${data}.xlsx`;

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${nome}"`);
        res.setHeader("Content-Length", buffer.length);
        res.send(Buffer.from(buffer));
    } catch (e) {
        next(e);
    }
};
