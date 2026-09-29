const UsuarioService = require("../services/usuarioService");
const service = new UsuarioService();

exports.listar = (req, res, next) => {
    try {
        res.json(service.listar(req.query));
    } catch (e) {
        next(e);
    }
};
exports.buscar = (req, res, next) => {
    try {
        res.json(service.buscar(Number(req.params.id)));
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
exports.resetarSenha = (req, res, next) => {
    try {
        service.resetarSenha(Number(req.params.id), req.body.novaSenha, req);
        res.json({ ok: true, mensagem: "Senha redefinida." });
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
