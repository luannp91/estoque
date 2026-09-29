const env = require("../config/env");

module.exports = (err, req, res, next) => {
    const status = err.status || 500;

    if (status >= 500) {
        console.error(`[${new Date().toISOString()}] ERRO ${status} em ${req.method} ${req.path}`);
        console.error(err.stack);

        // 🚨 Emite alerta em tempo real para super-admins
        try {
            const realtime = require("../services/realtimeService");
            realtime.emit("sistema:erro", {
                timestamp: new Date().toISOString(),
                metodo: req.method,
                path: req.path,
                mensagem: err.message,
                usuario: req.usuario ? { id: req.usuario.id, nome: req.usuario.nome } : null
            });
        } catch {
            /* ignora */
        }
    } else if (!env.isProducao && status >= 400) {
        console.warn(`[${new Date().toISOString()}] ${status} em ${req.method} ${req.path}: ${err.message}`);
    }

    const resposta = {
        erro: status >= 500 && env.isProducao ? "Erro interno do servidor." : err.message || "Erro interno do servidor."
    };

    if (!env.isProducao && status >= 500) {
        resposta.stack = err.stack;
    }

    res.status(status).json(resposta);
};
