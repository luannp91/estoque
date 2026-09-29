if (!Auth.exigirLogin()) throw new Error("não logado");
document.getElementById("topbar").innerHTML = UI.montarTopbar("dashboard");

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

let graficoCategorias, graficoTop;

async function carregar() {
    try {
        const dados = await api("/relatorios/dashboard");
        renderizarStats(dados.resumo);
        renderizarEstoqueBaixo(dados.estoqueBaixo);
        renderizarGraficos(dados);
    } catch (err) {
        UI.toast(err.message, "erro");
    }
}

function renderizarStats(r) {
    document.getElementById("stats").innerHTML = `
        <div class="stat"><div class="rotulo">Total de Produtos</div><div class="valor">${r.total_produtos}</div></div>
        <div class="stat sucesso"><div class="rotulo">Itens em Estoque</div><div class="valor">${r.total_itens}</div></div>
        <div class="stat"><div class="rotulo">Valor Total</div><div class="valor">${UI.formatarMoeda(r.valor_total)}</div></div>
        <div class="stat alerta"><div class="rotulo">Estoque Baixo</div><div class="valor">${r.estoque_baixo}</div></div>
        <div class="stat perigo"><div class="rotulo">Sem Estoque</div><div class="valor">${r.sem_estoque}</div></div>
    `;
}

function renderizarEstoqueBaixo(lista) {
    const alvo = document.getElementById("estoque-baixo");
    if (!lista.length) {
        alvo.innerHTML = '<p class="sem-dados">Nenhum produto com estoque baixo. 🎉</p>';
        return;
    }

    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr><th>ID</th><th>Nome</th><th>Categoria</th><th>Qtd Atual</th><th>Estoque Mín.</th></tr>
                </thead>
                <tbody>
                    ${lista
                        .map(
                            (p) => `
                        <tr>
                            <td>${p.id}</td>
                            <td>${escapeHtml(p.nome)}</td>
                            <td>${escapeHtml(p.categoria_nome || "—")}</td>
                            <td><span class="badge ${p.quantidade === 0 ? "vermelho" : "amarelo"}">${p.quantidade}</span></td>
                            <td>${p.estoque_minimo}</td>
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
            ${lista
                .map(
                    (p) => `
                <div class="item-card log-card">
                    <div class="item-card-header">
                        <div class="item-card-titulo">
                            <span class="item-card-id">#${p.id}</span>
                            <span class="item-card-nome" style="font-size:0.9rem">${escapeHtml(p.nome)}</span>
                        </div>
                        <span class="badge ${p.quantidade === 0 ? "vermelho" : "amarelo"}">${p.quantidade} un.</span>
                    </div>
                    <div class="item-card-info">
                        ${p.categoria_nome ? `<div class="info-linha"><span class="info-label">Categoria</span><span class="info-valor">${escapeHtml(p.categoria_nome)}</span></div>` : ""}
                        <div class="info-linha"><span class="info-label">Estoque mínimo</span><span class="info-valor">${p.estoque_minimo}</span></div>
                    </div>
                </div>
            `
                )
                .join("")}
        </div>
    `;

    alvo.innerHTML = tabela + cards;
}

function renderizarGraficos(dados) {
    const cats = dados.porCategoria;
    const ctx1 = document.getElementById("grafico-categorias").getContext("2d");
    graficoCategorias?.destroy();
    graficoCategorias = new Chart(ctx1, {
        type: "doughnut",
        data: {
            labels: cats.map((c) => c.categoria),
            datasets: [
                {
                    data: cats.map((c) => c.total),
                    backgroundColor: ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#06b6d4", "#ec4899"]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom", labels: { boxWidth: 12, padding: 10, font: { size: 11 } } } }
        }
    });

    const top = dados.topProdutos;
    const ctx2 = document.getElementById("grafico-top").getContext("2d");
    graficoTop?.destroy();
    graficoTop = new Chart(ctx2, {
        type: "bar",
        data: {
            labels: top.map((p) => p.nome),
            datasets: [
                {
                    label: "Valor em estoque (R$)",
                    data: top.map((p) => p.preco * p.quantidade),
                    backgroundColor: "#2563eb",
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } }
        }
    });
}

if (typeof Socket !== "undefined") {
    Socket.on("produto:criado", () => carregar());
    Socket.on("produto:atualizado", () => carregar());
    Socket.on("produto:removido", () => carregar());
    Socket.on("produto:movimentado", () => carregar());
    Socket.on("movimentacao:criada", () => carregar());
}

carregar();
