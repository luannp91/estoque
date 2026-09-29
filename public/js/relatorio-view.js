// relatorio-view.js
if (!Auth.exigirLogin()) throw new Error("não logado");

document.getElementById("topbar").innerHTML = UI.montarTopbar("relatorios");

const params = new URLSearchParams(window.location.search);
const inicio = params.get("inicio") || "";
const fim = params.get("fim") || "";

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

function formatarData(d) {
    if (!d) return "—";
    return new Date(d).toLocaleString("pt-BR");
}

function badgeStatus(p) {
    if (p.quantidade === 0) return '<span class="badge vermelho">sem estoque</span>';
    if (p.quantidade <= p.estoque_minimo) return '<span class="badge amarelo">baixo</span>';
    return '<span class="badge verde">ok</span>';
}

function badgeTipo(tipo) {
    const cores = {
        entrada: "verde",
        saida: "vermelho",
        ajuste: "azul",
        cadastro: "azul",
        remocao: "cinza"
    };
    return `<span class="badge ${cores[tipo] || "cinza"}">${escapeHtml(tipo)}</span>`;
}

// ==================== CARREGAR ====================
async function carregarRelatorio() {
    const alvo = document.getElementById("conteudo-relatorio");

    try {
        const query = new URLSearchParams();
        if (inicio) query.set("inicio", inicio);
        if (fim) query.set("fim", fim);

        const dados = await api(`/relatorios/completo?${query}`);

        const periodoTexto = inicio || fim ? `${inicio || "início"} a ${fim || "hoje"}` : "Todo o período";

        document.getElementById("meta-periodo").textContent = periodoTexto;
        document.getElementById("meta-gerado").textContent = formatarData(dados.geradoEm);

        renderizar(alvo, dados, periodoTexto);
    } catch (err) {
        console.error(err);
        alvo.innerHTML = `
            <div style="text-align:center;padding:2rem;color:var(--perigo)">
                <h2>❌ Erro ao carregar relatório</h2>
                <p>${escapeHtml(err.message)}</p>
            </div>
        `;
    }
}

// ==================== RENDERIZAR ====================
function renderizar(alvo, d, periodo) {
    alvo.innerHTML = `
        ${secaoResumo(d.resumo)}
        ${secaoCategorias(d.porCategoria)}
        ${secaoTopProdutos(d.topProdutos)}
        ${secaoEstoqueBaixo(d.estoqueBaixo)}
        ${secaoMovimentacoes(d.movimentacoesResumo, periodo)}
        ${secaoProdutos(d.produtos)}
        ${secaoMovDetalhadas(d.movimentacoes)}
    `;
}

// -------- Resumo (usa .stats-grid + .stat do projeto) --------
function secaoResumo(r) {
    return `
        <section class="relatorio-secao">
            <h2 class="secao-titulo">📊 Resumo Geral</h2>
            <div class="stats-grid">
                <div class="stat">
                    <div class="rotulo">Total de Produtos</div>
                    <div class="valor">${r.total_produtos}</div>
                </div>
                <div class="stat sucesso">
                    <div class="rotulo">Itens em Estoque</div>
                    <div class="valor">${r.total_itens}</div>
                </div>
                <div class="stat">
                    <div class="rotulo">Valor Total</div>
                    <div class="valor" style="font-size:1.2rem">${UI.formatarMoeda(r.valor_total)}</div>
                </div>
                <div class="stat alerta">
                    <div class="rotulo">Estoque Baixo</div>
                    <div class="valor">${r.estoque_baixo}</div>
                </div>
                <div class="stat perigo">
                    <div class="rotulo">Sem Estoque</div>
                    <div class="valor">${r.sem_estoque}</div>
                </div>
            </div>
        </section>
    `;
}

// -------- Categorias --------
function secaoCategorias(lista) {
    if (!lista.length) return "";

    const total = lista.reduce((s, c) => s + c.total, 0) || 1;

    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Categoria</th>
                        <th class="text-center">Qtd. Produtos</th>
                        <th class="text-right">% do Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${lista
                        .map(
                            (c) => `
                        <tr>
                            <td>${escapeHtml(c.categoria)}</td>
                            <td class="text-center">${c.total}</td>
                            <td class="text-right">${((c.total / total) * 100).toFixed(1)}%</td>
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
                    (c) => `
                <div class="item-card">
                    <div class="item-card-header">
                        <div class="item-card-titulo">
                            <span class="item-card-nome">${escapeHtml(c.categoria)}</span>
                        </div>
                        <span class="badge azul">${((c.total / total) * 100).toFixed(1)}%</span>
                    </div>
                    <div class="item-card-info">
                        <div class="info-linha">
                            <span class="info-label">Produtos</span>
                            <span class="info-valor"><strong>${c.total}</strong></span>
                        </div>
                    </div>
                </div>
            `
                )
                .join("")}
        </div>
    `;

    return `
        <section class="relatorio-secao">
            <h2 class="secao-titulo">🏷️ Produtos por Categoria</h2>
            ${tabela}
            ${cards}
        </section>
    `;
}

// -------- Top Produtos --------
function secaoTopProdutos(lista) {
    if (!lista.length) return "";

    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Posição</th>
                        <th>Produto</th>
                        <th class="text-right">Preço</th>
                        <th class="text-center">Qtd</th>
                        <th class="text-right">Valor Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${lista
                        .map(
                            (p, i) => `
                        <tr>
                            <td class="text-center"><strong>${i + 1}º</strong></td>
                            <td>${escapeHtml(p.nome)}</td>
                            <td class="text-right">${UI.formatarMoeda(p.preco)}</td>
                            <td class="text-center">${p.quantidade}</td>
                            <td class="text-right"><strong>${UI.formatarMoeda(p.preco * p.quantidade)}</strong></td>
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
                    (p, i) => `
                <div class="item-card">
                    <div class="item-card-header">
                        <div class="item-card-titulo">
                            <span class="item-card-id">#${i + 1}</span>
                            <span class="item-card-nome">${escapeHtml(p.nome)}</span>
                        </div>
                        <span class="badge verde">${UI.formatarMoeda(p.preco * p.quantidade)}</span>
                    </div>
                    <div class="item-card-info">
                        <div class="info-linha">
                            <span class="info-label">Preço</span>
                            <span class="info-valor">${UI.formatarMoeda(p.preco)}</span>
                        </div>
                        <div class="info-linha">
                            <span class="info-label">Qtd</span>
                            <span class="info-valor">${p.quantidade}</span>
                        </div>
                    </div>
                </div>
            `
                )
                .join("")}
        </div>
    `;

    return `
        <section class="relatorio-secao">
            <h2 class="secao-titulo">🏆 Top Produtos por Valor</h2>
            ${tabela}
            ${cards}
        </section>
    `;
}

// -------- Estoque Baixo --------
function secaoEstoqueBaixo(lista) {
    if (!lista.length) {
        return `
            <section class="relatorio-secao">
                <h2 class="secao-titulo">⚠️ Alertas de Estoque</h2>
                <p style="padding:1rem;text-align:center;color:var(--sucesso);font-style:italic">
                    ✅ Nenhum produto em situação crítica
                </p>
            </section>
        `;
    }

    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Produto</th>
                        <th class="text-center">Qtd Atual</th>
                        <th class="text-center">Mínimo</th>
                        <th class="text-center">Faltando</th>
                    </tr>
                </thead>
                <tbody>
                    ${lista
                        .map((p) => {
                            const faltando = Math.max(0, p.estoque_minimo - p.quantidade);
                            return `
                            <tr>
                                <td>${p.id}</td>
                                <td>${escapeHtml(p.nome)}</td>
                                <td class="text-center">${badgeStatus(p)} ${p.quantidade}</td>
                                <td class="text-center">${p.estoque_minimo}</td>
                                <td class="text-center"><strong>${faltando}</strong></td>
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
            ${lista
                .map((p) => {
                    const faltando = Math.max(0, p.estoque_minimo - p.quantidade);
                    return `
                    <div class="item-card">
                        <div class="item-card-header">
                            <div class="item-card-titulo">
                                <span class="item-card-id">#${p.id}</span>
                                <span class="item-card-nome">${escapeHtml(p.nome)}</span>
                            </div>
                            ${badgeStatus(p)}
                        </div>
                        <div class="item-card-info">
                            <div class="info-linha">
                                <span class="info-label">Qtd atual</span>
                                <span class="info-valor"><strong>${p.quantidade}</strong></span>
                            </div>
                            <div class="info-linha">
                                <span class="info-label">Mínimo</span>
                                <span class="info-valor">${p.estoque_minimo}</span>
                            </div>
                            <div class="info-linha">
                                <span class="info-label">Faltando</span>
                                <span class="info-valor" style="color:var(--perigo)"><strong>${faltando}</strong></span>
                            </div>
                        </div>
                    </div>
                `;
                })
                .join("")}
        </div>
    `;

    return `
        <section class="relatorio-secao">
            <h2 class="secao-titulo">⚠️ Alertas de Estoque Baixo</h2>
            ${tabela}
            ${cards}
        </section>
    `;
}

// -------- Movimentações (resumo) --------
function secaoMovimentacoes(resumo, periodo) {
    if (!resumo.length) return "";

    const total = resumo.reduce((s, r) => s + r.soma_qtd, 0);
    const totalMov = resumo.reduce((s, r) => s + r.total, 0);

    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th class="text-center">Qtd. Movimentos</th>
                        <th class="text-center">Total de Itens</th>
                    </tr>
                </thead>
                <tbody>
                    ${resumo
                        .map(
                            (r) => `
                        <tr>
                            <td>${badgeTipo(r.tipo)}</td>
                            <td class="text-center">${r.total}</td>
                            <td class="text-center">${r.soma_qtd}</td>
                        </tr>
                    `
                        )
                        .join("")}
                    <tr style="background:var(--bg);font-weight:700">
                        <td>TOTAL</td>
                        <td class="text-center">${totalMov}</td>
                        <td class="text-center">${total}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    const cards = `
        <div class="lista-cards">
            ${resumo
                .map(
                    (r) => `
                <div class="item-card">
                    <div class="item-card-header">
                        <div class="item-card-titulo">${badgeTipo(r.tipo)}</div>
                        <span class="badge azul">${r.total} mov.</span>
                    </div>
                    <div class="item-card-info">
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

    return `
        <section class="relatorio-secao">
            <h2 class="secao-titulo">🔄 Movimentações no Período (${escapeHtml(periodo)})</h2>
            ${tabela}
            ${cards}
        </section>
    `;
}

// -------- Lista Completa de Produtos --------
function secaoProdutos(lista) {
    if (!lista.length) return "";

    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr>
                        <th class="text-center">ID</th>
                        <th>Nome</th>
                        <th>SKU</th>
                        <th>Categoria</th>
                        <th class="text-right">Preço</th>
                        <th class="text-center">Qtd</th>
                        <th class="text-center">Mín.</th>
                        <th class="text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${lista
                        .map(
                            (p) => `
                        <tr>
                            <td class="text-center">${p.id}</td>
                            <td>${escapeHtml(p.nome)}</td>
                            <td>${escapeHtml(p.sku || "—")}</td>
                            <td>${escapeHtml(p.categoria_nome || "—")}</td>
                            <td class="text-right">${UI.formatarMoeda(p.preco)}</td>
                            <td class="text-center">${p.quantidade}</td>
                            <td class="text-center">${p.estoque_minimo}</td>
                            <td class="text-center">${badgeStatus(p)}</td>
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
                <div class="item-card">
                    <div class="item-card-header">
                        <div class="item-card-titulo">
                            <span class="item-card-id">#${p.id}</span>
                            <span class="item-card-nome">${escapeHtml(p.nome)}</span>
                        </div>
                        ${badgeStatus(p)}
                    </div>
                    <div class="item-card-info">
                        ${p.sku ? `<div class="info-linha"><span class="info-label">SKU</span><span class="info-valor">${escapeHtml(p.sku)}</span></div>` : ""}
                        ${p.categoria_nome ? `<div class="info-linha"><span class="info-label">Categoria</span><span class="info-valor">${escapeHtml(p.categoria_nome)}</span></div>` : ""}
                        <div class="info-linha">
                            <span class="info-label">Preço</span>
                            <span class="info-valor">${UI.formatarMoeda(p.preco)}</span>
                        </div>
                        <div class="info-linha">
                            <span class="info-label">Qtd / Mínimo</span>
                            <span class="info-valor">${p.quantidade} / ${p.estoque_minimo}</span>
                        </div>
                    </div>
                </div>
            `
                )
                .join("")}
        </div>
    `;

    return `
        <section class="relatorio-secao grande quebra-pagina">
            <h2 class="secao-titulo">📦 Lista Completa de Produtos (${lista.length})</h2>
            ${tabela}
            ${cards}
        </section>
    `;
}

// -------- Movimentações Detalhadas --------
function secaoMovDetalhadas(lista) {
    if (!lista.length) return "";

    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Produto</th>
                        <th class="text-center">Tipo</th>
                        <th class="text-center">Qtd</th>
                        <th class="text-center">Antes → Depois</th>
                        <th>Usuário</th>
                        <th>Observação</th>
                    </tr>
                </thead>
                <tbody>
                    ${lista
                        .map(
                            (m) => `
                        <tr>
                            <td>${UI.formatarData(m.criado_em)}</td>
                            <td>${escapeHtml(m.produto_nome || "—")}</td>
                            <td class="text-center">${badgeTipo(m.tipo)}</td>
                            <td class="text-center">${m.quantidade}</td>
                            <td class="text-center">${m.quantidade_anterior} → ${m.quantidade_nova}</td>
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
            ${lista
                .map(
                    (m) => `
                <div class="item-card">
                    <div class="item-card-header">
                        <div class="item-card-titulo">
                            <span class="item-card-nome">${escapeHtml(m.produto_nome || "—")}</span>
                        </div>
                        ${badgeTipo(m.tipo)}
                    </div>
                    <div class="item-card-info">
                        <div class="info-linha">
                            <span class="info-label">Data</span>
                            <span class="info-valor">${UI.formatarData(m.criado_em)}</span>
                        </div>
                        <div class="info-linha">
                            <span class="info-label">Qtd</span>
                            <span class="info-valor"><strong>${m.quantidade}</strong></span>
                        </div>
                        <div class="info-linha">
                            <span class="info-label">Antes → Depois</span>
                            <span class="info-valor">${m.quantidade_anterior} → ${m.quantidade_nova}</span>
                        </div>
                        <div class="info-linha">
                            <span class="info-label">Usuário</span>
                            <span class="info-valor">${escapeHtml(m.usuario_nome || "—")}</span>
                        </div>
                        ${m.observacao ? `<div class="info-linha"><span class="info-label">Obs.</span><span class="info-valor">${escapeHtml(m.observacao)}</span></div>` : ""}
                    </div>
                </div>
            `
                )
                .join("")}
        </div>
    `;

    return `
        <section class="relatorio-secao grande quebra-pagina">
            <h2 class="secao-titulo">📋 Histórico Detalhado (${lista.length})</h2>
            ${tabela}
            ${cards}
        </section>
    `;
}

// ==================== SALVAR EXCEL ====================
async function salvarExcel() {
    try {
        UI.toast("Gerando planilha Excel...", "info");

        const query = new URLSearchParams();
        if (inicio) query.set("inicio", inicio);
        if (fim) query.set("fim", fim);

        const resp = await fetch(`/api/relatorios/exportar-excel?${query}`, {
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

        UI.toast(`Planilha baixada: ${nome}`, "sucesso");
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}
window.salvarExcel = salvarExcel;

// ==================== INIT ====================
carregarRelatorio();
