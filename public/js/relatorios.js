if (!Auth.exigirLogin()) throw new Error("não logado");
document.getElementById("topbar").innerHTML = UI.montarTopbar("relatorios");

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

let dadosAtuais = null;

// ===================== CARREGAMENTO =====================
async function carregar() {
    const inicio = document.getElementById("inicio").value;
    const fim = document.getElementById("fim").value;
    const params = new URLSearchParams();
    if (inicio) params.set("inicio", inicio);
    if (fim) params.set("fim", fim);

    try {
        const [resumo, movs] = await Promise.all([
            api("/relatorios/dashboard"),
            api(`/relatorios/movimentacoes?${params}`)
        ]);
        dadosAtuais = { resumo: resumo.resumo, movs, top: resumo.topProdutos };
        renderizar(dadosAtuais);
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}

// ===================== RENDERIZAÇÃO =====================
function renderizar({ resumo, movs, top }) {
    const alvo = document.getElementById("conteudo");

    alvo.innerHTML = `
        <h3 class="section-title" style="margin:1rem 0 .75rem">Resumo Geral</h3>
        <div class="stats-grid">
            <div class="stat"><div class="rotulo">Total de Produtos</div><div class="valor">${resumo.total_produtos}</div></div>
            <div class="stat sucesso"><div class="rotulo">Itens em Estoque</div><div class="valor">${resumo.total_itens}</div></div>
            <div class="stat"><div class="rotulo">Valor Total</div><div class="valor">${UI.formatarMoeda(resumo.valor_total)}</div></div>
            <div class="stat alerta"><div class="rotulo">Estoque Baixo</div><div class="valor">${resumo.estoque_baixo}</div></div>
            <div class="stat perigo"><div class="rotulo">Sem Estoque</div><div class="valor">${resumo.sem_estoque}</div></div>
        </div>

        <h3 class="section-title" style="margin:1.5rem 0 .75rem">
            Movimentações — ${escapeHtml(movs.periodo.inicio)} a ${escapeHtml(movs.periodo.fim)}
        </h3>
        ${renderizarMovimentacoes(movs)}

        <h3 class="section-title" style="margin:1.5rem 0 .75rem">Top Produtos por Valor em Estoque</h3>
        ${renderizarTopProdutos(top)}
    `;
}

// ===================== MOVIMENTAÇÕES =====================
function renderizarMovimentacoes(movs) {
    if (!movs.resumo.length) {
        return '<p class="sem-dados">Nenhuma movimentação no período.</p>';
    }

    const coresTipo = {
        entrada: "verde",
        saida: "vermelho",
        ajuste: "azul",
        cadastro: "azul",
        remocao: "cinza"
    };

    // ===== TABELA (desktop) =====
    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr><th>Tipo</th><th>Qtde de movimentos</th><th>Total de itens</th></tr>
                </thead>
                <tbody>
                    ${movs.resumo
                        .map(
                            (r) => `
                        <tr>
                            <td><span class="badge ${coresTipo[r.tipo] || "cinza"}">${escapeHtml(r.tipo)}</span></td>
                            <td>${r.total}</td>
                            <td>${r.soma_qtd}</td>
                        </tr>
                    `
                        )
                        .join("")}
                </tbody>
            </table>
        </div>
    `;

    // ===== CARDS (mobile/tablet) =====
    const cards = `
        <div class="lista-cards">
            ${movs.resumo
                .map(
                    (r) => `
                <div class="item-card log-card">
                    <div class="item-card-header">
                        <div class="item-card-titulo">
                            <span class="item-card-nome" style="font-size:0.9rem">
                                <span class="badge ${coresTipo[r.tipo] || "cinza"}">${escapeHtml(r.tipo)}</span>
                            </span>
                        </div>
                    </div>
                    <div class="item-card-info">
                        <div class="info-linha">
                            <span class="info-label">Movimentos</span>
                            <span class="info-valor"><strong>${r.total}</strong></span>
                        </div>
                        <div class="info-linha">
                            <span class="info-label">Total de itens</span>
                            <span class="info-valor"><strong>${r.soma_qtd}</strong></span>
                        </div>
                    </div>
                </div>
            `
                )
                .join("")}
        </div>
    `;

    return tabela + cards;
}

// ===================== TOP PRODUTOS =====================
function renderizarTopProdutos(top) {
    if (!top.length) {
        return '<p class="sem-dados">Nenhum produto cadastrado.</p>';
    }

    // ===== TABELA (desktop) =====
    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr><th>ID</th><th>Nome</th><th>Preço</th><th>Qtd</th><th>Valor Total</th></tr>
                </thead>
                <tbody>
                    ${top
                        .map(
                            (p) => `
                        <tr>
                            <td>${p.id}</td>
                            <td>${escapeHtml(p.nome)}</td>
                            <td>${UI.formatarMoeda(p.preco)}</td>
                            <td>${p.quantidade}</td>
                            <td><strong>${UI.formatarMoeda(p.preco * p.quantidade)}</strong></td>
                        </tr>
                    `
                        )
                        .join("")}
                </tbody>
            </table>
        </div>
    `;

    // ===== CARDS (mobile/tablet) =====
    const cards = `
        <div class="lista-cards">
            ${top
                .map(
                    (p) => `
                <div class="item-card log-card">
                    <div class="item-card-header">
                        <div class="item-card-titulo">
                            <span class="item-card-id">#${p.id}</span>
                            <span class="item-card-nome" style="font-size:0.9rem">${escapeHtml(p.nome)}</span>
                        </div>
                        <span class="badge verde">${UI.formatarMoeda(p.preco * p.quantidade)}</span>
                    </div>
                    <div class="item-card-info">
                        <div class="info-linha">
                            <span class="info-label">Preço unit.</span>
                            <span class="info-valor">${UI.formatarMoeda(p.preco)}</span>
                        </div>
                        <div class="info-linha">
                            <span class="info-label">Quantidade</span>
                            <span class="info-valor">${p.quantidade}</span>
                        </div>
                    </div>
                </div>
            `
                )
                .join("")}
        </div>
    `;

    return tabela + cards;
}

// ===================== EXPORT CSV =====================
function exportarCSV() {
    if (!dadosAtuais) return;
    const { resumo, movs, top } = dadosAtuais;
    const linhas = [
        ["RESUMO GERAL"],
        ["Total de Produtos", resumo.total_produtos],
        ["Itens em Estoque", resumo.total_itens],
        ["Valor Total", resumo.valor_total],
        ["Estoque Baixo", resumo.estoque_baixo],
        ["Sem Estoque", resumo.sem_estoque],
        [],
        ["MOVIMENTAÇÕES - TIPO", "QTD MOVIMENTOS", "TOTAL ITENS"],
        ...movs.resumo.map((r) => [r.tipo, r.total, r.soma_qtd]),
        [],
        ["TOP PRODUTOS", "PREÇO", "QUANTIDADE", "VALOR TOTAL"],
        ...top.map((p) => [p.nome, p.preco, p.quantidade, p.preco * p.quantidade])
    ];
    const csv = linhas.map((l) => l.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast("CSV exportado!", "sucesso");
}
window.exportarCSV = exportarCSV;

// ===================== 🆕 VER RELATÓRIO COMPLETO =====================
function abrirRelatorio() {
    const inicio = document.getElementById("inicio")?.value || "";
    const fim = document.getElementById("fim")?.value || "";

    const params = new URLSearchParams();
    if (inicio) params.set("inicio", inicio);
    if (fim) params.set("fim", fim);

    window.open(`relatorio.html?${params}`, "_blank");
}
window.abrirRelatorio = abrirRelatorio;

// Garante que o onclick="carregar()" do botão Aplicar também funcione
window.carregar = carregar;

// ===================== EXPORT EXCEL =====================
async function exportarExcel() {
    const inicio = document.getElementById("inicio").value;
    const fim = document.getElementById("fim").value;
    const params = new URLSearchParams();
    if (inicio) params.set("inicio", inicio);
    if (fim) params.set("fim", fim);

    try {
        UI.toast("Gerando planilha corporativa...", "info");

        const resp = await fetch(`/api/relatorios/exportar-excel?${params}`, {
            headers: { Authorization: `Bearer ${Auth.token()}` }
        });

        if (!resp.ok) {
            const erro = await resp.json().catch(() => ({ erro: "Falha ao gerar Excel." }));
            throw new Error(erro.erro);
        }

        const cd = resp.headers.get("Content-Disposition") || "";
        const match = cd.match(/filename="?([^"]+)"?/);
        const nome = match ? match[1] : `relatorio-estoque-${Date.now()}.xlsx`;

        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nome;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        UI.toast(`Planilha gerada: ${nome}`, "sucesso");
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}
window.exportarExcel = exportarExcel;

// ===================== INIT =====================
carregar();
