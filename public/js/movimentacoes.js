if (!Auth.exigirLogin()) throw new Error("não logado");
document.getElementById("topbar").innerHTML = UI.montarTopbar("movimentacoes");

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const estado = { pagina: 1, limite: 20, tipo: "", produto_id: "", data_inicio: "", data_fim: "" };

async function carregar() {
    const params = new URLSearchParams({ pagina: estado.pagina, limite: estado.limite });
    if (estado.tipo) params.set("tipo", estado.tipo);
    if (estado.produto_id) params.set("produto_id", estado.produto_id);
    if (estado.data_inicio) params.set("data_inicio", estado.data_inicio + " 00:00:00");
    if (estado.data_fim) params.set("data_fim", estado.data_fim + " 23:59:59");

    try {
        renderizar(await api(`/movimentacoes?${params}`));
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}

function renderizar(res) {
    const alvo = document.getElementById("tabela");
    if (!res.itens || !res.itens.length) {
        alvo.innerHTML = '<p class="sem-dados">Nenhuma movimentação encontrada.</p>';
        document.getElementById("paginacao").innerHTML = "";
        return;
    }

    const coresTipo = { entrada: "verde", saida: "vermelho", ajuste: "azul", cadastro: "azul", remocao: "cinza" };

    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Data</th><th>Produto</th><th>Tipo</th>
                        <th>Qtd</th><th>Antes</th><th>Depois</th>
                        <th>Usuário</th><th>Observação</th>
                    </tr>
                </thead>
                <tbody>
                    ${res.itens
                        .map(
                            (m) => `
                        <tr>
                            <td>${UI.formatarData(m.criado_em)}</td>
                            <td>${escapeHtml(m.produto_nome || "—")}</td>
                            <td><span class="badge ${coresTipo[m.tipo] || "cinza"}">${m.tipo}</span></td>
                            <td>${m.quantidade}</td>
                            <td>${m.quantidade_anterior}</td>
                            <td>${m.quantidade_nova}</td>
                            <td>${escapeHtml(m.usuario_nome || "—")}</td>
                            <td>${escapeHtml(m.observacao || "—")}</td>
                        </tr>
                    `
                        )
                        .join("")}
                </tbody>
            </table>
        </div>
    `;

    const cards = `
        <div class="lista-cards">
            ${res.itens
                .map(
                    (m) => `
                <div class="item-card log-card">
                    <div class="item-card-header">
                        <div class="item-card-titulo">
                            <span class="item-card-nome">${escapeHtml(m.produto_nome || "—")}</span>
                        </div>
                        <span class="badge ${coresTipo[m.tipo] || "cinza"}">${m.tipo}</span>
                    </div>
                    <div class="item-card-info">
                        <div class="info-linha"><span class="info-label">Data</span><span class="info-valor">${UI.formatarData(m.criado_em)}</span></div>
                        <div class="info-linha"><span class="info-label">Quantidade</span><span class="info-valor"><strong>${m.quantidade}</strong></span></div>
                        <div class="info-linha"><span class="info-label">Antes → Depois</span><span class="info-valor">${m.quantidade_anterior} → ${m.quantidade_nova}</span></div>
                        ${m.usuario_nome ? `<div class="info-linha"><span class="info-label">Usuário</span><span class="info-valor">${escapeHtml(m.usuario_nome)}</span></div>` : ""}
                        ${m.observacao ? `<div class="info-linha"><span class="info-label">Obs.</span><span class="info-valor">${escapeHtml(m.observacao)}</span></div>` : ""}
                    </div>
                </div>
            `
                )
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
                carregar();
            };
        });
}

document.getElementById("filtro-tipo").addEventListener("change", (e) => {
    estado.tipo = e.target.value;
    estado.pagina = 1;
    carregar();
});
const elInicio = document.getElementById("filtro-inicio");
if (elInicio)
    elInicio.addEventListener("change", (e) => {
        estado.data_inicio = e.target.value;
        estado.pagina = 1;
        carregar();
    });
const elFim = document.getElementById("filtro-fim");
if (elFim)
    elFim.addEventListener("change", (e) => {
        estado.data_fim = e.target.value;
        estado.pagina = 1;
        carregar();
    });

if (typeof Socket !== "undefined") {
    Socket.on("movimentacao:criada", () => carregar());
    Socket.on("produto:movimentado", () => carregar());
}

carregar();
