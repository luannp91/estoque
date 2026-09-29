const jwt = require("jsonwebtoken");
const db = require("../config/database");
const env = require("../config/env");
const SecurityLogService = require("../services/securityLogService");

const secLog = new SecurityLogService();

// ==================== HIERARQUIA DE PAPÉIS ====================
const NIVEIS = {
    operador: 1,
    admin: 2,
    super_admin: 3
};

function temNivel(usuario, nivelMinimo) {
    if (!usuario || !usuario.papel) return false;
    return (NIVEIS[usuario.papel] || 0) >= nivelMinimo;
}

// ==================== AUTENTICAÇÃO ====================
function autenticar(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ erro: "Token não informado." });
    }

    try {
        const payload = jwt.verify(token, env.jwtSecret, { issuer: "estoque-app" });

        if (payload.tipo === "refresh") {
            return res.status(401).json({ erro: "Token de refresh não é aceito aqui." });
        }

        const usuario = db.prepare("SELECT id, papel, ativo, bloqueado_ate FROM usuarios WHERE id = ?").get(payload.id);

        if (!usuario) {
            secLog.acessoNegado(req, "usuário não existe mais");
            return res.status(401).json({ erro: "Usuário não existe mais." });
        }
        if (usuario.ativo === 0) {
            secLog.acessoNegado(req, `usuário ${usuario.id} inativo`);
            return res.status(403).json({ erro: "Conta desativada." });
        }
        if (usuario.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()) {
            secLog.acessoNegado(req, `usuário ${usuario.id} bloqueado`);
            return res.status(403).json({ erro: "Conta temporariamente bloqueada." });
        }

        req.usuario = { ...payload, papel: usuario.papel };
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ erro: "Token expirado.", codigo: "EXPIRADO" });
        }
        return res.status(401).json({ erro: "Token inválido." });
    }
}

// ==================== AUTORIZAÇÃO ====================

function apenasAdmin(req, res, next) {
    if (!temNivel(req.usuario, NIVEIS.admin)) {
        secLog.acessoNegado(req, `usuário ${req.usuario?.id} (${req.usuario?.papel}) tentou acessar rota admin`);
        return res.status(403).json({ erro: "Acesso restrito a administradores." });
    }
    next();
}

function apenasSuperAdmin(req, res, next) {
    if (!temNivel(req.usuario, NIVEIS.super_admin)) {
        secLog.acessoNegado(req, `usuário ${req.usuario?.id} (${req.usuario?.papel}) tentou acessar super-admin`);
        return res.status(403).json({ erro: "Acesso restrito ao desenvolvedor." });
    }
    next();
}

function apenasOperador(req, res, next) {
    if (!temNivel(req.usuario, NIVEIS.operador)) {
        return res.status(403).json({ erro: "Acesso negado." });
    }
    next();
}

module.exports = {
    autenticar,
    apenasAdmin,
    apenasSuperAdmin,
    apenasOperador,
    temNivel,
    NIVEIS
};
