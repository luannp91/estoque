const LogService = require("../services/logService");
const service = new LogService();

exports.listar = (req, res, next) => {
    try {
        res.json(service.listar(req.query));
    } catch (e) {
        next(e);
    }
};
exports.estatisticas = (req, res, next) => {
    try {
        res.json(service.estatisticas());
    } catch (e) {
        next(e);
    }
};
exports.filtros = (req, res, next) => {
    try {
        res.json({ acoes: service.acoes(), entidades: service.entidades() });
    } catch (e) {
        next(e);
    }
};
exports.limpar = (req, res, next) => {
    try {
        const dias = Number(req.query.dias) || 90;
        const removidos = service.limparAntigos(dias);
        service.registrar({
            req,
            acao: "limpar_logs",
            entidade: "sistema",
            descricao: `Removeu ${removidos} logs com mais de ${dias} dias`
        });
        res.json({ ok: true, removidos });
    } catch (e) {
        next(e);
    }
};
