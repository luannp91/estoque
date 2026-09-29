const MovimentacaoService = require("../services/movimentacaoService");
const service = new MovimentacaoService();

exports.listar = (req, res, next) => {
    try {
        res.json(service.listar(req.query));
    } catch (e) {
        next(e);
    }
};
