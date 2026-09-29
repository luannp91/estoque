if (!Auth.exigirSuperAdmin()) throw new Error("não autorizado");

document.getElementById("topbar").innerHTML = UI.montarTopbar("super-admin");

// ==================== ESTADO ====================
let graficoMemoria = null;
let graficoCpu = null;
let eventosFeed = [];
const MAX_EVENTOS = 50;

// ==================== HELPERS ====================
function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// ==================== MÉTRICAS ====================
async function carregarMetricas() {
    try {
        const m = await api("/super-admin/metricas");
        renderizarKPIs(m);
        renderizarGraficos(m);
    } catch (e) {
        console.error("Erro métricas:", e);
    }
}

function renderizarKPIs(m) {
    const uptime = m.processo.uptime_s;
    const h = Math.floor(uptime / 3600);
    const min = Math.floor((uptime % 3600) / 60);

    document.getElementById("metricas-kpis").innerHTML = `
        <div class="stat">
            <div class="rotulo">Uptime</div>
            <div class="valor" style="font-size:1.4rem">${h}h ${min}min</div>
        </div>
        <div class="stat">
            <div class="rotulo">Memória (RSS)</div>
            <div class="valor" style="font-size:1.4rem">${m.processo.memoria.rss_mb} MB</div>
        </div>
        <div class="stat ${m.requisicoes.ultimos_5min.erros_500 > 0 ? "perigo" : "sucesso"}">
            <div class="rotulo">Requisições (5min)</div>
            <div class="valor" style="font-size:1.4rem">${m.requisicoes.ultimos_5min.total}</div>
        </div>
        <div class="stat ${m.requisicoes.ultimos_5min.erros_500 > 0 ? "perigo" : ""}">
            <div class="rotulo">Erros 500 (5min)</div>
            <div class="valor" style="font-size:1.4rem">${m.requisicoes.ultimos_5min.erros_500}</div>
        </div>
        <div class="stat">
            <div class="rotulo">WebSocket</div>
            <div class="valor" style="font-size:1.4rem">${m.websocket.clientes_conectados}</div>
        </div>
        <div class="stat">
            <div class="rotulo">Tempo médio</div>
            <div class="valor" style="font-size:1.4rem">${m.requisicoes.ultimos_5min.duracao_media_ms} ms</div>
        </div>
        <div class="stat">
            <div class="rotulo">Banco</div>
            <div class="valor" style="font-size:1.4rem">${m.banco.tamanho_legivel}</div>
        </div>
        <div class="stat">
            <div class="rotulo">Uso de CPU</div>
            <div class="valor" style="font-size:1.4rem">${m.sistema.load_avg["1m"]}%</div>
        </div>
    `;
}

function renderizarGraficos(m) {
    const hist = m.historico || [];

    const ctxMem = document.getElementById("grafico-memoria").getContext("2d");
    graficoMemoria?.destroy();
    graficoMemoria = new Chart(ctxMem, {
        type: "line",
        data: {
            labels: hist.map((h) => new Date(h.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })),
            datasets: [
                {
                    label: "RSS (MB)",
                    data: hist.map((h) => h.rss_mb),
                    borderColor: "#2563eb",
                    backgroundColor: "rgba(37, 99, 235, 0.1)",
                    tension: 0.3,
                    fill: true
                },
                {
                    label: "Heap (MB)",
                    data: hist.map((h) => h.heap_mb),
                    borderColor: "#16a34a",
                    backgroundColor: "rgba(22, 163, 74, 0.1)",
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } },
            scales: { y: { beginAtZero: true } }
        }
    });

    const ctxCpu = document.getElementById("grafico-cpu").getContext("2d");
    graficoCpu?.destroy();
    graficoCpu = new Chart(ctxCpu, {
        type: "line",
        data: {
            labels: hist.map((h) => new Date(h.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })),
            datasets: [
                {
                    label: "Load Average (1m)",
                    data: hist.map((h) => h.cpu_load_1m),
                    borderColor: "#f59e0b",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// ==================== ALERTAS ====================
async function carregarAlertas() {
    try {
        const { alertas } = await api("/super-admin/alertas");
        const alvo = document.getElementById("alertas-container");

        if (alertas.length === 0) {
            alvo.innerHTML = `
                <div class="alerta-item info">
                    <div class="alerta-icon">✅</div>
                    <div>
                        <div class="alerta-titulo">Tudo em ordem</div>
                        <div class="alerta-descricao">Nenhum alerta ativo no momento.</div>
                    </div>
                </div>
            `;
            return;
        }

        const icones = { alto: "🚨", medio: "⚠️", info: "ℹ️" };

        alvo.innerHTML = alertas
            .map(
                (a) => `
            <div class="alerta-item ${a.nivel}">
                <div class="alerta-icon">${icones[a.nivel] || "ℹ️"}</div>
                <div>
                    <div class="alerta-titulo">${escapeHtml(a.titulo)}</div>
                    <div class="alerta-descricao">${escapeHtml(a.descricao)}</div>
                </div>
            </div>
        `
            )
            .join("");
    } catch (e) {
        console.error(e);
    }
}

// ==================== AUDITORIA ====================
async function rodarAuditoria() {
    const alvo = document.getElementById("auditoria-container");
    alvo.innerHTML = '<div class="loading"><span class="spinner"></span> Auditando...</div>';

    try {
        const r = await api("/super-admin/auditar", { method: "POST" });

        const badgeNivel = {
            critico: "badge vermelho",
            aviso: "badge amarelo",
            info: "badge azul"
        };

        alvo.innerHTML = `
            <p style="margin-bottom:1rem;color:var(--texto-suave);font-size:.9rem">
                Auditado em ${UI.formatarData(r.timestamp)} —
                <strong>${r.criticos}</strong> crítico(s),
                <strong>${r.avisos}</strong> aviso(s),
                <strong>${r.problemas.length}</strong> total
            </p>
            ${
                r.problemas.length === 0
                    ? '<div class="alerta-item info"><div class="alerta-icon">✅</div><div><div class="alerta-titulo">Tudo certo</div><div class="alerta-descricao">Nenhum problema encontrado.</div></div></div>'
                    : r.problemas
                          .map(
                              (p) => `
                    <div class="auditoria-problema ${p.nivel}">
                        <span class="${badgeNivel[p.nivel]}">${p.nivel}</span>
                        <span>${escapeHtml(p.texto)}</span>
                    </div>
                `
                          )
                          .join("")
            }
        `;
    } catch (e) {
        alvo.innerHTML = `<p class="sem-dados">Erro: ${escapeHtml(e.message)}</p>`;
    }
}
window.rodarAuditoria = rodarAuditoria;

async function carregarAuditoriaEstatisticas() {
    try {
        const a = await api("/super-admin/auditoria");
        const alvo = document.getElementById("auditoria-stats");

        alvo.innerHTML = `
            <div class="stats-grid">
                <div class="stat">
                    <div class="rotulo">Usuários</div>
                    <div class="valor">${a.usuarios.total}</div>
                </div>
                <div class="stat sucesso">
                    <div class="rotulo">Com 2FA</div>
                    <div class="valor">${a.usuarios.com_2fa}</div>
                </div>
                <div class="stat ${a.usuarios.bloqueados > 0 ? "perigo" : ""}">
                    <div class="rotulo">Bloqueados</div>
                    <div class="valor">${a.usuarios.bloqueados}</div>
                </div>
                <div class="stat">
                    <div class="rotulo">Admins</div>
                    <div class="valor">${a.usuarios.admins + a.usuarios.super_admins}</div>
                </div>
                <div class="stat alerta">
                    <div class="rotulo">Logins falhos (7d)</div>
                    <div class="valor">${a.seguranca.logins_falhos || 0}</div>
                </div>
                <div class="stat perigo">
                    <div class="rotulo">Acessos negados (7d)</div>
                    <div class="valor">${a.seguranca.acessos_negados || 0}</div>
                </div>
                <div class="stat">
                    <div class="rotulo">Logs (24h)</div>
                    <div class="valor">${a.logs.ultimas_24h}</div>
                </div>
                <div class="stat">
                    <div class="rotulo">Produtos na lixeira</div>
                    <div class="valor">${a.produtos.deletados}</div>
                </div>
            </div>
        `;
    } catch (e) {
        console.error(e);
    }
}
window.carregarAuditoriaEstatisticas = carregarAuditoriaEstatisticas;

// ==================== FEED EM TEMPO REAL ====================
async function carregarEventosIniciais() {
    try {
        const eventos = await api("/super-admin/eventos");
        eventosFeed = eventos.slice(0, MAX_EVENTOS);
        renderizarFeed();
    } catch (e) {
        console.error(e);
    }
}

function renderizarFeed() {
    const alvo = document.getElementById("feed-eventos");

    if (eventosFeed.length === 0) {
        alvo.innerHTML = '<p class="sem-dados">Nenhum evento ainda.</p>';
        return;
    }

    alvo.innerHTML = `
        <p style="margin-bottom:.75rem;color:var(--texto-suave);font-size:.85rem">
            <span class="ao-vivo"></span>
            ${eventosFeed.length} evento(s) — atualização automática
        </p>
        ${eventosFeed
            .map((e) => {
                const hora = new Date(e.criado_em).toLocaleTimeString("pt-BR");
                return `
                <div class="feed-item ${e.nivel || "info"}">
                    <span class="feed-hora">${hora}</span>
                    <span class="feed-ator">${escapeHtml(e.usuario_nome || "—")}</span>
                    <span class="feed-acao">${escapeHtml(e.acao)}</span>
                    <span style="flex:1;color:var(--texto-suave)">${escapeHtml(e.descricao || "")}</span>
                </div>
            `;
            })
            .join("")}
    `;
}

function adicionarEventoFeed(evento) {
    eventosFeed.unshift(evento);
    if (eventosFeed.length > MAX_EVENTOS) eventosFeed.pop();
    renderizarFeed();
}

// ==================== WEBSOCKET ====================
Socket.on("sistema:evento", (dados) => {
    adicionarEventoFeed(dados);
});

Socket.on("sistema:erro", (dados) => {
    UI.toast(`🚨 Erro em ${dados.metodo} ${dados.path}: ${dados.mensagem}`, "erro", 8000);
    carregarAlertas();
});

Socket.on("produto:criado", () => carregarMetricas());
Socket.on("produto:removido", () => carregarMetricas());

// ==================== INIT ====================
carregarMetricas();
carregarAlertas();
carregarEventosIniciais();
carregarAuditoriaEstatisticas();

setInterval(carregarMetricas, 10000);
setInterval(carregarAlertas, 30000);
