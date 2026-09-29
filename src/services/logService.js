const LogRepository = require("../repositories/logRepository");

class LogService {
    constructor() {
        this.repo = new LogRepository();
    }

    registrar({ req, acao, entidade, entidade_id, descricao, nivel = "info" }) {
        try {
            const usuario = req?.usuario || null;
            const ip = req?.ip || req?.headers?.["x-forwarded-for"] || req?.connection?.remoteAddress;
            const ua = req?.headers?.["user-agent"];

            this.repo.registrar({
                usuario_id: usuario?.id || null,
                usuario_nome: usuario?.nome || "Sistema",
                usuario_papel: usuario?.papel || null,
                acao,
                entidade: entidade || null,
                entidade_id: entidade_id || null,
                descricao: descricao || null,
                ip: ip ? String(ip).substring(0, 100) : null,
                user_agent: ua ? String(ua).substring(0, 300) : null,
                nivel
            });

            // 🆕 Emite evento em tempo real para o feed do super-admin
            try {
                const realtime = require("./realtimeService");
                realtime.emit("sistema:evento", {
                    criado_em: new Date().toISOString(),
                    usuario_nome: usuario?.nome || "Sistema",
                    acao,
                    descricao,
                    nivel
                });
            } catch {
                /* ignora */
            }
        } catch (e) {
            console.error("Falha ao registrar log:", e.message);
        }
    }

    listar(filtros) {
        return this.repo.listar({
            busca: filtros.busca || "",
            usuario_id: filtros.usuario_id ? Number(filtros.usuario_id) : null,
            acao: filtros.acao || null,
            entidade: filtros.entidade || null,
            nivel: filtros.nivel || null,
            data_inicio: filtros.data_inicio || null,
            data_fim: filtros.data_fim || null,
            pagina: Number(filtros.pagina) || 1,
            limite: Number(filtros.limite) || 20
        });
    }

    estatisticas() {
        return this.repo.estatisticas();
    }
    acoes() {
        return this.repo.acoesDistintas();
    }
    entidades() {
        return this.repo.entidadesDistintas();
    }
    limparAntigos(dias = 90) {
        return this.repo.limparMaisAntigos(dias);
    }
}

module.exports = LogService;
