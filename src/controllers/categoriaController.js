const CategoriaService = require("../services/categoriaService");
const service = new CategoriaService();

exports.listar = (req, res, next) => {
    try {
        res.json(service.listar());
    } catch (e) {
        next(e);
    }
};
exports.criar = (req, res, next) => {
    try {
        res.status(201).json(service.criar(req.body, req));
    } catch (e) {
        next(e);
    }
};
exports.atualizar = (req, res, next) => {
    try {
        res.json(service.atualizar(Number(req.params.id), req.body, req));
    } catch (e) {
        next(e);
    }
};
exports.remover = (req, res, next) => {
    try {
        service.remover(Number(req.params.id), req);
        res.status(204).send();
    } catch (e) {
        next(e);
    }
};
