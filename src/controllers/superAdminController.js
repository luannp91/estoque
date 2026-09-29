const metricsService = require("../services/metricsService");
const LogService = require("../services/logService");

const logService = new LogService();

exports.metricas = (req, res, next) => {
    try {
        res.json(metricsService.getSnapshot());
    } catch (e) {
        next(e);
    }
};

exports.auditoria = (req, res, next) => {
    try {
        res.json(metricsService.getAuditoria());
    } catch (e) {
        next(e);
    }
};

exports.alertas = (req, res, next) => {
    try {
        res.json({
            timestamp: new Date().toISOString(),
            alertas: metricsService.getAlertas()
        });
    } catch (e) {
        next(e);
    }
};

exports.auditar = (req, res, next) => {
    try {
        const resultado = metricsService.auditarSeguranca();

        logService.registrar({
            req,
            acao: "SEC_AUDITORIA_MANUAL",
            entidade: "seguranca",
            descricao: `Super-admin rodou auditoria: ${resultado.criticos} crítico(s), ${resultado.avisos} aviso(s)`,
            nivel: resultado.criticos > 0 ? "error" : "info"
        });

        res.json(resultado);
    } catch (e) {
        next(e);
    }
};

exports.eventosRecentes = (req, res, next) => {
    try {
        const db = require("../config/database");
        const eventos = db
            .prepare(
                `
            SELECT id, acao, usuario_nome, usuario_papel, entidade, entidade_id,
                   descricao, ip, nivel, criado_em
            FROM logs_sistema
            ORDER BY id DESC
            LIMIT 50
        `
            )
            .all();

        res.json(eventos);
    } catch (e) {
        next(e);
    }
};
