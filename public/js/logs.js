if (!Auth.exigirLogin()) throw new Error("não logado");
if (!Auth.admin()) {
    alert("Acesso restrito a administradores.");
    window.location.href = "dashboard.html";
}
document.getElementById("topbar").innerHTML = UI.montarTopbar("logs");

const estado = { pagina: 1, limite: 20, busca: "", acao: "", entidade: "", nivel: "", data_inicio: "", data_fim: "" };

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function valorOuTraco(v) {
    return v === null || v === undefined || v === "" ? "—" : v;
}

async function carregarFiltros() {
    try {
        const { acoes, entidades } = await api("/logs/filtros");
        document.getElementById("filtro-acao").innerHTML =
            '<option value="">Todas</option>' +
            acoes.map((a) => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join("");
        document.getElementById("filtro-entidade").innerHTML =
            '<option value="">Todas</option>' +
            entidades.map((e) => `<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`).join("");
    } catch (e) {}
}

async function carregarEstatisticas() {
    try {
        const r = await api("/logs/estatisticas");
        document.getElementById("stats-logs").innerHTML = `
            <div class="stat"><div class="rotulo">Total</div><div class="valor">${r.total || 0}</div></div>
            <div class="stat sucesso"><div class="rotulo">Info</div><div class="valor">${r.info || 0}</div></div>
            <div class="stat alerta"><div class="rotulo">Avisos</div><div class="valor">${r.warn || 0}</div></div>
            <div class="stat perigo"><div class="rotulo">Erros</div><div class="valor">${r.error || 0}</div></div>
            <div class="stat"><div class="rotulo">Últimas 24h</div><div class="valor">${r.ultimas_24h || 0}</div></div>
            <div class="stat"><div class="rotulo">Últimos 7d</div><div class="valor">${r.ultimos_7d || 0}</div></div>
        `;
    } catch (e) {}
}

async function carregarLogs() {
    const params = new URLSearchParams({ pagina: estado.pagina, limite: estado.limite });
    if (estado.busca) params.set("busca", estado.busca);
    if (estado.acao) params.set("acao", estado.acao);
    if (estado.entidade) params.set("entidade", estado.entidade);
    if (estado.nivel) params.set("nivel", estado.nivel);
    if (estado.data_inicio) params.set("data_inicio", estado.data_inicio + " 00:00:00");
    if (estado.data_fim) params.set("data_fim", estado.data_fim + " 23:59:59");

    try {
        renderizar(await api(`/logs?${params}`));
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}

function renderizar(res) {
    const alvo = document.getElementById("tabela");
    if (!res.itens || !res.itens.length) {
        alvo.innerHTML = '<p class="sem-dados">Nenhum log encontrado.</p>';
        document.getElementById("paginacao").innerHTML = "";
        return;
    }

    const coresNivel = { info: "azul", warn: "amarelo", error: "vermelho" };

    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Quando</th><th>Usuário</th><th>Ação</th>
                        <th>Entidade</th><th>Descrição</th><th>IP</th>
                    </tr>
                </thead>
                <tbody>
                    ${res.itens
                        .map((l) => {
                            const dataFmt = l.criado_em ? UI.formatarData(l.criado_em) : "—";
                            const usuario = valorOuTraco(l.usuario_nome);
                            const papel = l.usuario_papel
                                ? `<span class="badge cinza">${escapeHtml(l.usuario_papel)}</span>`
                                : "";
                            const acao = valorOuTraco(l.acao);
                            const nivel = l.nivel || "info";
                            const entidade = l.entidade
                                ? `${escapeHtml(l.entidade)}${l.entidade_id ? " #" + l.entidade_id : ""}`
                                : "—";
                            return `
                            <tr>
                                <td>${dataFmt}</td>
                                <td>${escapeHtml(usuario)} ${papel}</td>
                                <td><span class="badge ${coresNivel[nivel] || "cinza"}">${escapeHtml(acao)}</span></td>
                                <td>${entidade}</td>
                                <td>${escapeHtml(valorOuTraco(l.descricao))}</td>
                                <td>${escapeHtml(valorOuTraco(l.ip))}</td>
                            </tr>
                        `;
                        })
                        .join("")}
                </tbody>
            </table>
        </div>
    `;

    const cards = `
        <div class="lista-cards">
            ${res.itens
                .map((l) => {
                    const nivel = l.nivel || "info";
                    const acao = valorOuTraco(l.acao);
                    return `
                    <div class="item-card log-card">
                        <div class="item-card-header">
                            <div class="item-card-titulo">
                                <span class="item-card-nome" style="font-size:0.9rem">${escapeHtml(acao)}</span>
                            </div>
                            <span class="badge ${coresNivel[nivel] || "cinza"}">${nivel}</span>
                        </div>
                        <div class="item-card-info">
                            <div class="info-linha"><span class="info-label">Quando</span><span class="info-valor">${l.criado_em ? UI.formatarData(l.criado_em) : "—"}</span></div>
                            <div class="info-linha"><span class="info-label">Usuário</span><span class="info-valor">${escapeHtml(valorOuTraco(l.usuario_nome))}</span></div>
                            ${l.entidade ? `<div class="info-linha"><span class="info-label">Entidade</span><span class="info-valor">${escapeHtml(l.entidade)}${l.entidade_id ? " #" + l.entidade_id : ""}</span></div>` : ""}
                            ${l.descricao ? `<div class="info-linha"><span class="info-label">Descrição</span><span class="info-valor">${escapeHtml(l.descricao)}</span></div>` : ""}
                            ${l.ip ? `<div class="info-linha"><span class="info-label">IP</span><span class="info-valor">${escapeHtml(l.ip)}</span></div>` : ""}
                        </div>
                    </div>
                `;
                })
                .join("")}
        </div>
    `;

    alvo.innerHTML = tabela + cards;

    document.getElementById("paginacao").innerHTML = `
        <span>Página ${res.pagina} de ${res.totalPaginas} — ${res.total} registro(s)</span>
        <div class="botoes">
            <button class="pequeno secundario" ${res.pagina <= 1 ? "disabled" : ""} data-pagina="${res.pagina - 1}">‹ Anterior</button>
            <button class="pequeno secundario" ${res.pagina >= res.totalPaginas ? "disabled" : ""} data-pagina="${res.pagina + 1}">Próxima ›</button>
        </div>
    `;
    document
        .getElementById("paginacao")
        .querySelectorAll("button[data-pagina]")
        .forEach((btn) => {
            btn.onclick = () => {
                estado.pagina = Number(btn.dataset.pagina);
                carregarLogs();
            };
        });
}

async function limparAntigos() {
    const ok = await UI.confirmar("Remover todos os logs com mais de 90 dias?", {
        titulo: "Limpar logs antigos",
        tipo: "alerta",
        textoConfirmar: "Limpar"
    });
    if (!ok) return;
    try {
        const r = await api("/logs/limpar?dias=90", { method: "DELETE" });
        UI.toast(`${r.removidos} logs removidos.`, "sucesso");
        carregarEstatisticas();
        carregarLogs();
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}
window.limparAntigos = limparAntigos;

let timer;
document.getElementById("filtro-busca").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
        estado.busca = e.target.value.trim();
        estado.pagina = 1;
        carregarLogs();
    }, 350);
});
document.getElementById("filtro-acao").addEventListener("change", (e) => {
    estado.acao = e.target.value;
    estado.pagina = 1;
    carregarLogs();
});
document.getElementById("filtro-entidade").addEventListener("change", (e) => {
    estado.entidade = e.target.value;
    estado.pagina = 1;
    carregarLogs();
});
document.getElementById("filtro-nivel").addEventListener("change", (e) => {
    estado.nivel = e.target.value;
    estado.pagina = 1;
    carregarLogs();
});
document.getElementById("filtro-inicio").addEventListener("change", (e) => {
    estado.data_inicio = e.target.value;
    estado.pagina = 1;
    carregarLogs();
});
document.getElementById("filtro-fim").addEventListener("change", (e) => {
    estado.data_fim = e.target.value;
    estado.pagina = 1;
    carregarLogs();
});

carregarFiltros();
carregarEstatisticas();
carregarLogs();

if (typeof Socket !== "undefined") {
    Socket.on("produto:criado", () => {
        carregarEstatisticas();
        carregarLogs();
    });
    Socket.on("produto:atualizado", () => {
        carregarEstatisticas();
        carregarLogs();
    });
    Socket.on("produto:removido", () => {
        carregarEstatisticas();
        carregarLogs();
    });
    Socket.on("produto:movimentado", () => {
        carregarEstatisticas();
        carregarLogs();
    });
}
