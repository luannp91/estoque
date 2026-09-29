const LogService = require("./logService");

/**
 * Centraliza logs de eventos de segurança com severidade.
 * Estes logs alimentam alertas e detecção de anomalias.
 */
class SecurityLogService {
    constructor() {
        this.log = new LogService();
    }

    registrar({ req, evento, descricao, severidade = "info", usuario_id = null, detalhes = {} }) {
        const acao = `SEC_${evento.toUpperCase()}`;

        this.log.registrar({
            req,
            acao,
            entidade: "seguranca",
            entidade_id: usuario_id,
            descricao: `${descricao}${Object.keys(detalhes).length ? " | " + JSON.stringify(detalhes) : ""}`,
            nivel:
                severidade === "critico" || severidade === "alto" ? "error" : severidade === "medio" ? "warn" : "info"
        });
    }

    // ============ Eventos pré-definidos ============

    loginSucesso(req, usuario) {
        this.registrar({
            req,
            evento: "login_sucesso",
            descricao: `Login OK: ${usuario.email}`,
            severidade: "info",
            usuario_id: usuario.id,
            detalhes: { ip: req.ip, ua: req.headers["user-agent"]?.substring(0, 100) }
        });
    }

    loginFalha(req, email, motivo) {
        this.registrar({
            req,
            evento: "login_falha",
            descricao: `Falha de login: ${email} (${motivo})`,
            severidade: "medio",
            detalhes: { ip: req.ip }
        });
    }

    contaBloqueada(req, email) {
        this.registrar({
            req,
            evento: "conta_bloqueada",
            descricao: `Conta bloqueada por tentativas excessivas: ${email}`,
            severidade: "alto",
            detalhes: { ip: req.ip }
        });
    }

    senhaAlterada(req, usuario_id, porAdmin = false) {
        this.registrar({
            req,
            evento: "senha_alterada",
            descricao: porAdmin ? "Senha redefinida por admin" : "Usuário alterou a senha",
            severidade: "medio",
            usuario_id
        });
    }

    acessoNegado(req, motivo) {
        this.registrar({
            req,
            evento: "acesso_negado",
            descricao: `Acesso negado: ${motivo}`,
            severidade: "medio",
            detalhes: { path: req.path, ip: req.ip }
        });
    }

    rateLimit(req) {
        this.registrar({
            req,
            evento: "rate_limit",
            descricao: `Rate limit atingido em ${req.path}`,
            severidade: "medio",
            detalhes: { ip: req.ip }
        });
    }

    doisFatoresAtivado(req, usuario_id) {
        this.registrar({
            req,
            evento: "2fa_ativado",
            usuario_id,
            descricao: "2FA ativado",
            severidade: "medio"
        });
    }

    doisFatoresDesativado(req, usuario_id) {
        this.registrar({
            req,
            evento: "2fa_desativado",
            usuario_id,
            descricao: "2FA desativado",
            severidade: "alto"
        });
    }

    doisFatoresFalha(req, usuario_id) {
        this.registrar({
            req,
            evento: "2fa_falha",
            usuario_id,
            descricao: "Código 2FA inválido",
            severidade: "medio"
        });
    }
}

module.exports = SecurityLogService;
