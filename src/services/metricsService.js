const os = require("os");
const fs = require("fs");
const path = require("path");
const db = require("../config/database");

// ==================== CPU REAL (funciona no Windows!) ====================
/**
 * Windows NÃO implementa os.loadavg() — sempre retorna [0,0,0].
 * Solução universal: medir a diferença de `os.cpus().times` entre amostras.
 *   uso% = 100 - (idle_diff / total_diff) * 100
 */
let _ultimaAmostraCpu = null;

function _snapshotCpuTimes() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    for (const cpu of cpus) {
        for (const tipo in cpu.times) total += cpu.times[tipo];
        idle += cpu.times.idle;
    }
    return { idle, total };
}

function calcularUsoCpu() {
    const atual = _snapshotCpuTimes();
    if (!_ultimaAmostraCpu) {
        _ultimaAmostraCpu = atual;
        return 0;
    }
    const idleDiff = atual.idle - _ultimaAmostraCpu.idle;
    const totalDiff = atual.total - _ultimaAmostraCpu.total;
    _ultimaAmostraCpu = atual;

    if (totalDiff <= 0) return 0;
    const uso = 100 - (100 * idleDiff) / totalDiff;
    return +Math.min(100, Math.max(0, uso)).toFixed(1);
}

// Amostra inicial para calibrar
calcularUsoCpu();

// ==================== HISTÓRICO (5s por amostra) ====================
const historico = [];
const MAX_HISTORICO = 120; // 120 * 5s = 10 minutos
const INTERVALO_MS = 5000; // ⭐ era ~30s, agora 5s

function amostrar() {
    const mem = process.memoryUsage();
    const cpu = calcularUsoCpu();

    historico.push({
        ts: Date.now(),
        rss_mb: Math.round(mem.rss / 1024 / 1024),
        heap_mb: Math.round(mem.heapUsed / 1024 / 1024),
        cpu_load_1m: cpu, // ⭐ agora é % real (0-100)
        uptime_s: Math.floor(process.uptime())
    });

    if (historico.length > MAX_HISTORICO) historico.shift();
}

amostrar();
setInterval(amostrar, INTERVALO_MS);

// ==================== REQUISIÇÕES ====================
const requisicoesLog = [];
const JANELA_MS = 15 * 60 * 1000;

function registrarRequisicao({ metodo, path: p, status, duracao }) {
    requisicoesLog.push({
        ts: Date.now(),
        metodo: String(metodo || "GET"),
        path: String(p || "/"),
        status: Number(status) || 0,
        duracao: Number.isFinite(Number(duracao)) ? Number(duracao) : 0
    });

    const agora = Date.now();
    while (requisicoesLog.length && agora - requisicoesLog[0].ts > JANELA_MS) {
        requisicoesLog.shift();
    }
}

function _resumo(minutos) {
    const corte = Date.now() - minutos * 60 * 1000;
    const filtradas = requisicoesLog.filter((r) => r.ts >= corte);
    const total = filtradas.length;

    if (!total) {
        return { total: 0, erros_500: 0, erros_4xx: 0, duracao_media_ms: 0 };
    }

    const erros500 = filtradas.filter((r) => r.status >= 500).length;
    const erros4xx = filtradas.filter((r) => r.status >= 400 && r.status < 500).length;

    // 🛡️ Defensivo: trata `undefined`, `null` e NaN como 0
    const somaDuracao = filtradas.reduce((s, r) => {
        const d = Number(r.duracao);
        return s + (Number.isFinite(d) ? d : 0);
    }, 0);

    const durMedia = Math.round(somaDuracao / total);

    return {
        total,
        erros_500: erros500,
        erros_4xx: erros4xx,
        duracao_media_ms: Number.isFinite(durMedia) ? durMedia : 0
    };
}

// ==================== WEBSOCKET ====================
function _contarWebSocket() {
    try {
        const realtime = require("./realtimeService");
        const io = realtime.io;
        if (!io) return 0;
        return io.engine?.clientsCount ?? io.sockets?.sockets?.size ?? 0;
    } catch {
        return 0;
    }
}

// ==================== BANCO ====================
function _infoBanco() {
    try {
        const dbPath = path.resolve(__dirname, "..", "..", "estoque.db");
        const stat = fs.statSync(dbPath);
        const mb = stat.size / 1024 / 1024;
        return {
            tamanho_bytes: stat.size,
            tamanho_legivel: mb < 1 ? `${(stat.size / 1024).toFixed(1)} KB` : `${mb.toFixed(2)} MB`
        };
    } catch {
        return { tamanho_bytes: 0, tamanho_legivel: "0 KB" };
    }
}

// ==================== ERROS RECENTES ====================
function _errosRecentes() {
    try {
        return db
            .prepare(
                `
            SELECT id, acao, usuario_nome, descricao, criado_em
            FROM logs_sistema
            WHERE nivel = 'error'
              AND criado_em >= datetime('now', '-1 hour')
            ORDER BY id DESC
            LIMIT 10
        `
            )
            .all();
    } catch {
        return [];
    }
}

// ==================== SNAPSHOT ====================
function getSnapshot() {
    const mem = process.memoryUsage();
    const cpu = calcularUsoCpu();

    return {
        timestamp: new Date().toISOString(),

        processo: {
            pid: process.pid,
            uptime_s: Math.floor(process.uptime()),
            versao_node: process.version,
            memoria: {
                rss_mb: Math.round(mem.rss / 1024 / 1024),
                heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
                heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
                external_mb: Math.round(mem.external / 1024 / 1024)
            }
        },

        sistema: {
            hostname: os.hostname(),
            plataforma: os.platform(),
            cpus: os.cpus().length,
            modelo_cpu: os.cpus()[0]?.model?.trim() || "desconhecido",
            // ⭐ Coloca % real no "load_avg" para não precisar mudar o frontend
            load_avg: {
                "1m": cpu,
                "5m": cpu,
                "15m": cpu
            },
            memoria: {
                total_mb: Math.round(os.totalmem() / 1024 / 1024),
                livre_mb: Math.round(os.freemem() / 1024 / 1024),
                uso_percent: +((1 - os.freemem() / os.totalmem()) * 100).toFixed(1)
            }
        },

        requisicoes: {
            ultimos_1min: _resumo(1),
            ultimos_5min: _resumo(5),
            ultimos_15min: _resumo(15)
        },

        banco: _infoBanco(),

        websocket: {
            clientes_conectados: _contarWebSocket()
        },

        erros_recentes: _errosRecentes(),

        historico: [...historico]
    };
}

// ==================== AUDITORIA ====================
function getAuditoria() {
    try {
        const usuarios = db
            .prepare(
                `
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN totp_ativo = 1 THEN 1 ELSE 0 END) AS com_2fa,
                SUM(CASE WHEN bloqueado_ate IS NOT NULL AND bloqueado_ate > datetime('now') THEN 1 ELSE 0 END) AS bloqueados,
                SUM(CASE WHEN papel = 'admin' THEN 1 ELSE 0 END) AS admins,
                SUM(CASE WHEN papel = 'super' THEN 1 ELSE 0 END) AS super_admins
            FROM usuarios
        `
            )
            .get();

        const seguranca = db
            .prepare(
                `
            SELECT
                SUM(CASE WHEN acao = 'SEC_LOGIN_FALHA' THEN 1 ELSE 0 END) AS logins_falhos,
                SUM(CASE WHEN acao = 'SEC_ACESSO_NEGADO' THEN 1 ELSE 0 END) AS acessos_negados
            FROM logs_sistema
            WHERE criado_em >= datetime('now', '-7 day')
        `
            )
            .get();

        const logs = db
            .prepare(
                `
            SELECT COUNT(*) AS ultimas_24h
            FROM logs_sistema
            WHERE criado_em >= datetime('now', '-1 day')
        `
            )
            .get();

        const produtos = db
            .prepare(
                `
            SELECT SUM(CASE WHEN deletado_em IS NOT NULL THEN 1 ELSE 0 END) AS deletados
            FROM produtos
        `
            )
            .get();

        return {
            usuarios: {
                total: usuarios.total || 0,
                com_2fa: usuarios.com_2fa || 0,
                bloqueados: usuarios.bloqueados || 0,
                admins: usuarios.admins || 0,
                super_admins: usuarios.super_admins || 0
            },
            seguranca: {
                logins_falhos: seguranca.logins_falhos || 0,
                acessos_negados: seguranca.acessos_negados || 0
            },
            logs: { ultimas_24h: logs.ultimas_24h || 0 },
            produtos: { deletados: produtos.deletados || 0 }
        };
    } catch (e) {
        return {
            usuarios: { total: 0, com_2fa: 0, bloqueados: 0, admins: 0, super_admins: 0 },
            seguranca: { logins_falhos: 0, acessos_negados: 0 },
            logs: { ultimas_24h: 0 },
            produtos: { deletados: 0 }
        };
    }
}

// ==================== ALERTAS ====================
function getAlertas() {
    const alertas = [];
    const snap = getSnapshot();
    const cpu = snap.sistema.load_avg["1m"];

    if (cpu >= 80) {
        alertas.push({ nivel: "alto", titulo: `CPU em ${cpu}%`, descricao: "Uso de CPU acima de 80%." });
    } else if (cpu >= 60) {
        alertas.push({ nivel: "medio", titulo: `CPU em ${cpu}%`, descricao: "Uso de CPU moderadamente alto." });
    }

    if (snap.processo.memoria.rss_mb >= 500) {
        alertas.push({
            nivel: "alto",
            titulo: `Memória em ${snap.processo.memoria.rss_mb} MB`,
            descricao: "Uso acima de 500 MB."
        });
    } else if (snap.processo.memoria.rss_mb >= 250) {
        alertas.push({
            nivel: "medio",
            titulo: `Memória em ${snap.processo.memoria.rss_mb} MB`,
            descricao: "Uso de memória elevado."
        });
    }

    if (snap.requisicoes.ultimos_5min.erros_500 > 0) {
        alertas.push({
            nivel: "alto",
            titulo: `${snap.requisicoes.ultimos_5min.erros_500} erro(s) 500 nos últimos 5min`,
            descricao: "Verifique os logs do servidor."
        });
    }

    if (snap.requisicoes.ultimos_5min.duracao_media_ms > 1000) {
        alertas.push({
            nivel: "medio",
            titulo: `Latência média: ${snap.requisicoes.ultimos_5min.duracao_media_ms}ms`,
            descricao: "Respostas acima de 1s."
        });
    }

    try {
        const { t } = db
            .prepare(
                "SELECT COUNT(*) AS t FROM produtos WHERE quantidade <= estoque_minimo AND ativo = 1 AND deletado_em IS NULL"
            )
            .get();
        if (t > 0) {
            alertas.push({ nivel: "info", titulo: `${t} produto(s) com estoque baixo`, descricao: "Considere repor." });
        }
    } catch {}

    try {
        const { t } = db
            .prepare(
                "SELECT COUNT(*) AS t FROM usuarios WHERE papel IN ('admin','super') AND totp_ativo = 0 AND ativo = 1"
            )
            .get();
        if (t > 0) {
            alertas.push({ nivel: "medio", titulo: `${t} admin(s) sem 2FA`, descricao: "Ative 2FA para admins." });
        }
    } catch {}

    return alertas;
}

// ==================== AUDITORIA PROFUNDA ====================
function auditarSeguranca() {
    const problemas = [];

    try {
        const sem2fa = db
            .prepare(
                "SELECT nome, email, papel FROM usuarios WHERE papel IN ('admin','super') AND totp_ativo = 0 AND ativo = 1"
            )
            .all();
        for (const u of sem2fa) {
            problemas.push({
                nivel: u.papel === "super" ? "critico" : "aviso",
                texto: `Admin "${u.nome}" (${u.email}) sem 2FA ativo`
            });
        }
    } catch {}

    try {
        const bloqueadas = db
            .prepare(
                "SELECT nome, email FROM usuarios WHERE bloqueado_ate IS NOT NULL AND bloqueado_ate > datetime('now')"
            )
            .all();
        for (const u of bloqueadas) {
            problemas.push({ nivel: "aviso", texto: `Conta bloqueada: "${u.nome}" (${u.email})` });
        }
    } catch {}

    try {
        const { t } = db
            .prepare(
                "SELECT COUNT(*) AS t FROM logs_sistema WHERE acao = 'SEC_LOGIN_FALHA' AND criado_em >= datetime('now', '-1 hour')"
            )
            .get();
        if (t > 20) problemas.push({ nivel: "critico", texto: `${t} tentativas de login falhas na última hora` });
        else if (t > 5) problemas.push({ nivel: "aviso", texto: `${t} tentativas de login falhas na última hora` });
    } catch {}

    try {
        const antigas = db
            .prepare(
                "SELECT nome, email FROM usuarios WHERE senha_alterada_em IS NOT NULL AND senha_alterada_em < datetime('now', '-90 day')"
            )
            .all();
        if (antigas.length > 0) {
            problemas.push({ nivel: "info", texto: `${antigas.length} usuário(s) com senha há mais de 90 dias` });
        }
    } catch {}

    try {
        const { t } = db
            .prepare(
                "SELECT COUNT(*) AS t FROM produtos WHERE deletado_em IS NOT NULL AND deletado_em < datetime('now', '-60 day')"
            )
            .get();
        if (t > 0) {
            problemas.push({ nivel: "info", texto: `${t} produto(s) na lixeira há mais de 60 dias` });
        }
    } catch {}

    try {
        const { t } = db
            .prepare(
                "SELECT COUNT(*) AS t FROM logs_sistema WHERE nivel = 'error' AND criado_em >= datetime('now', '-24 hour')"
            )
            .get();
        if (t > 10) problemas.push({ nivel: "aviso", texto: `${t} erros nas últimas 24h` });
    } catch {}

    return {
        timestamp: new Date().toISOString(),
        criticos: problemas.filter((p) => p.nivel === "critico").length,
        avisos: problemas.filter((p) => p.nivel === "aviso").length,
        problemas
    };
}

module.exports = {
    getSnapshot,
    getAuditoria,
    getAlertas,
    auditarSeguranca,
    registrarRequisicao,
    calcularUsoCpu
};
