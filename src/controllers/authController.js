const AuthService = require("../services/authService");
const service = new AuthService();

exports.registrar = (req, res, next) => {
    try {
        res.status(201).json(service.registrar(req.body, req));
    } catch (e) {
        next(e);
    }
};

exports.login = (req, res, next) => {
    try {
        res.json(service.login(req.body, req));
    } catch (e) {
        next(e);
    }
};

exports.refresh = (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) throw Object.assign(new Error("Refresh token obrigatório."), { status: 400 });
        res.json(service.refresh(refreshToken, req));
    } catch (e) {
        next(e);
    }
};

exports.me = (req, res) => res.json(req.usuario);
exports.logout = (req, res, next) => {
    try {
        service.logout(req);
        res.status(204).send();
    } catch (e) {
        next(e);
    }
};

exports.trocarSenha = (req, res, next) => {
    try {
        const { senhaAtual, novaSenha } = req.body;
        service.trocarSenha(req.usuario.id, senhaAtual, novaSenha, req);
        res.json({ ok: true, mensagem: "Senha alterada com sucesso." });
    } catch (e) {
        next(e);
    }
};

// ==================== 2FA ====================
exports.iniciar2FA = async (req, res, next) => {
    try {
        res.json(await service.iniciar2FA(req.usuario.id, req));
    } catch (e) {
        next(e);
    }
};

exports.confirmar2FA = (req, res, next) => {
    try {
        service.confirmar2FA(req.usuario.id, req.body.codigo, req);
        res.json({ ok: true, mensagem: "2FA ativado com sucesso." });
    } catch (e) {
        next(e);
    }
};

exports.desativar2FA = (req, res, next) => {
    try {
        service.desativar2FA(req.usuario.id, req.body.senha, req);
        res.json({ ok: true, mensagem: "2FA desativado." });
    } catch (e) {
        next(e);
    }
};
