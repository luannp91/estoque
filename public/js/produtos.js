if (!Auth.exigirLogin()) throw new Error("não logado");
document.getElementById("topbar").innerHTML = UI.montarTopbar("produtos");

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const estado = { pagina: 1, limite: 5, ordenar: "nome", ordem: "asc", busca: "", categoria_id: "", status: "" };
const estadoLixeira = { pagina: 1, limite: 5 };
let categoriasCache = [];
let ultimoResultado = null;
let ultimoResultadoLixeira = null;
let modoAtual = "ativos";

function mudarAba(aba) {
    modoAtual = aba;
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("ativo", t.dataset.tab === aba));
    document.getElementById("secao-ativos").style.display = aba === "ativos" ? "" : "none";
    document.getElementById("secao-lixeira").style.display = aba === "lixeira" ? "" : "none";
    if (aba === "lixeira") carregarLixeira();
    else carregarProdutos();
}
window.mudarAba = mudarAba;

async function atualizarBadgeLixeira() {
    try {
        const { total } = await api("/produtos/lixeira/count");
        const exibir = total > 0;
        ["tab-badge-lixeira", "topbar-badge-lixeira"].forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = total;
            el.style.display = exibir ? "" : "none";
        });
    } catch {
        /* silencioso */
    }
}

async function carregarCategorias() {
    try {
        categoriasCache = await api("/categorias");
        const sel = document.getElementById("filtro-categoria");
        sel.innerHTML =
            '<option value="">Todas</option>' +
            categoriasCache.map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
    } catch (e) {
        console.error(e);
    }
}

async function carregarProdutos() {
    const alvo = document.getElementById("tabela");
    const temConteudo = alvo.querySelector("table tbody tr:not(.skeleton-row)");

    if (!temConteudo && !alvo.querySelector(".skeleton-row")) {
        alvo.innerHTML = `
            <div class="tabela-desktop tabela-wrapper">
                <table>
                    <thead>
                        <tr><th>ID</th><th>Nome</th><th>Preço</th><th>Qtd</th><th>Status</th><th>Ações</th></tr>
                    </thead>
                    <tbody>${UI.skeletonTabela(5, 6)}</tbody>
                </table>
            </div>
            <div class="lista-cards">${UI.spinner("grande")} Carregando...</div>
        `;
    }

    const params = new URLSearchParams({
        pagina: estado.pagina,
        limite: estado.limite,
        ordenar: estado.ordenar,
        ordem: estado.ordem
    });
    if (estado.busca) params.set("busca", estado.busca);
    if (estado.categoria_id) params.set("categoria_id", estado.categoria_id);
    if (estado.status === "baixo") params.set("estoque_baixo", "true");
    if (estado.status === "ativos") params.set("apenas_ativos", "true");

    try {
        ultimoResultado = await api(`/produtos?${params}`);
        renderizarProdutos(ultimoResultado);
        renderizarPaginacao(ultimoResultado);
    } catch (err) {
        UI.toast(err.message, "erro");
        alvo.innerHTML = `<p class="sem-dados">Erro ao carregar produtos.</p>`;
    }
}

async function carregarLixeira() {
    const alvo = document.getElementById("tabela-lixeira");
    alvo.innerHTML = `<div class="loading">${UI.spinner("grande")} Carregando...</div>`;

    const params = new URLSearchParams({ pagina: estadoLixeira.pagina, limite: estadoLixeira.limite });

    try {
        ultimoResultadoLixeira = await api(`/produtos/lixeira?${params}`);
        renderizarLixeira(ultimoResultadoLixeira);
        renderizarPaginacaoLixeira(ultimoResultadoLixeira);
        atualizarBadgeLixeira();
    } catch (err) {
        UI.toast(err.message, "erro");
        alvo.innerHTML = `<p class="sem-dados">Erro ao carregar a lixeira.</p>`;
    }
}

function badgeStatus(p) {
    if (p.quantidade === 0) return '<span class="badge vermelho">sem estoque</span>';
    if (p.estoqueBaixo) return '<span class="badge amarelo">baixo</span>';
    return '<span class="badge verde">ok</span>';
}

function renderizarProdutos(res) {
    const alvo = document.getElementById("tabela");

    if (!res.itens || !res.itens.length) {
        alvo.innerHTML = '<p class="sem-dados">Nenhum produto encontrado.</p>';
        return;
    }

    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr>
                        <th data-ord="id">ID</th>
                        <th data-ord="nome">Nome</th>
                        <th data-ord="preco">Preço</th>
                        <th data-ord="quantidade">Qtd</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${res.itens
                        .map(
                            (p) => `
                        <tr>
                            <td>${p.id}</td>
                            <td>${escapeHtml(p.nome)}${p.ativo ? "" : ' <span class="badge cinza">inativo</span>'}</td>
                            <td>${UI.formatarMoeda(p.preco)}</td>
                            <td>${p.quantidade}</td>
                            <td>${badgeStatus(p)}</td>
                            <td>
                                <div class="acao">
                                    <button class="pequeno" data-acao="entrada" data-id="${p.id}">+</button>
                                    <button class="pequeno secundario" data-acao="saida" data-id="${p.id}">−</button>
                                    <button class="pequeno secundario" data-acao="editar" data-id="${p.id}">✏</button>
                                    ${Auth.admin() ? `<button class="pequeno perigo" data-acao="remover" data-id="${p.id}">🗑</button>` : ""}
                                </div>
                            </td>
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
                        <div class="info-linha"><span class="info-label">Preço</span><span class="info-valor destaque">${UI.formatarMoeda(p.preco)}</span></div>
                        <div class="info-linha"><span class="info-label">Quantidade</span><span class="info-valor">${p.quantidade}</span></div>
                        <div class="info-linha"><span class="info-label">Estoque mín.</span><span class="info-valor">${p.estoque_minimo}</span></div>
                    </div>
                    <div class="item-card-actions">
                        <button class="pequeno" data-acao="entrada" data-id="${p.id}">+ Entrada</button>
                        <button class="pequeno secundario" data-acao="saida" data-id="${p.id}">− Saída</button>
                        <button class="pequeno secundario" data-acao="editar" data-id="${p.id}">✏ Editar</button>
                        ${Auth.admin() ? `<button class="pequeno perigo" data-acao="remover" data-id="${p.id}">🗑</button>` : ""}
                    </div>
                </div>
            `
                )
                .join("")}
        </div>
    `;

    alvo.innerHTML = tabela + cards;

    alvo.querySelectorAll("th[data-ord]").forEach((th) => {
        th.onclick = () => {
            const col = th.dataset.ord;
            if (estado.ordenar === col) estado.ordem = estado.ordem === "asc" ? "desc" : "asc";
            else {
                estado.ordenar = col;
                estado.ordem = "asc";
            }
            carregarProdutos();
        };
    });

    alvo.querySelectorAll("button[data-acao]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const acao = btn.dataset.acao;
            const id = Number(btn.dataset.id);
            const produto = ultimoResultado.itens.find((x) => x.id === id);
            if (acao === "entrada" || acao === "saida") abrirMovimentacao(id, acao, produto?.nome || `#${id}`);
            else if (acao === "editar") abrirFormProduto(id);
            else if (acao === "remover") removerProduto(id);
        });
    });
}

function renderizarPaginacao(res) {
    const alvo = document.getElementById("paginacao");
    alvo.innerHTML = `
        <span>Página ${res.pagina} de ${res.totalPaginas} — ${res.total} produto(s)</span>
        <div class="botoes">
            <button class="pequeno secundario" ${res.pagina <= 1 ? "disabled" : ""} data-pagina="${res.pagina - 1}">‹ Anterior</button>
            <button class="pequeno secundario" ${res.pagina >= res.totalPaginas ? "disabled" : ""} data-pagina="${res.pagina + 1}">Próxima ›</button>
        </div>
    `;
    alvo.querySelectorAll("button[data-pagina]").forEach((btn) => {
        btn.onclick = () => {
            estado.pagina = Number(btn.dataset.pagina);
            carregarProdutos();
        };
    });
}

function renderizarLixeira(res) {
    const alvo = document.getElementById("tabela-lixeira");

    if (!res.itens || !res.itens.length) {
        alvo.innerHTML = '<p class="sem-dados">🎉 A lixeira está vazia.</p>';
        document.getElementById("paginacao-lixeira").innerHTML = "";
        return;
    }

    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr><th>ID</th><th>Nome</th><th>Preço</th><th>Qtd</th><th>Deletado em</th><th>Ações</th></tr>
                </thead>
                <tbody>
                    ${res.itens
                        .map(
                            (p) => `
                        <tr class="linha-deletada">
                            <td>${p.id}</td>
                            <td>${escapeHtml(p.nome)}</td>
                            <td>${UI.formatarMoeda(p.preco)}</td>
                            <td>${p.quantidade}</td>
                            <td>${p.deletado_em ? UI.formatarData(p.deletado_em) : "—"}</td>
                            <td>
                                <div class="acao">
                                    <button class="pequeno" data-restaurar="${p.id}">↩ Restaurar</button>
                                </div>
                            </td>
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
                    (p) => `
                <div class="item-card deletado">
                    <div class="item-card-header">
                        <div class="item-card-titulo">
                            <span class="item-card-id">#${p.id}</span>
                            <span class="item-card-nome">${escapeHtml(p.nome)}</span>
                        </div>
                        <span class="badge cinza">deletado</span>
                    </div>
                    <div class="item-card-info">
                        <div class="info-linha"><span class="info-label">Preço</span><span class="info-valor destaque">${UI.formatarMoeda(p.preco)}</span></div>
                        <div class="info-linha"><span class="info-label">Quantidade</span><span class="info-valor">${p.quantidade}</span></div>
                        <div class="info-linha"><span class="info-label">Deletado em</span><span class="info-valor">${p.deletado_em ? UI.formatarData(p.deletado_em) : "—"}</span></div>
                    </div>
                    <div class="item-card-actions">
                        <button class="pequeno" data-restaurar="${p.id}">↩ Restaurar</button>
                    </div>
                </div>
            `
                )
                .join("")}
        </div>
    `;

    alvo.innerHTML = tabela + cards;

    alvo.querySelectorAll("button[data-restaurar]").forEach((btn) => {
        btn.addEventListener("click", () => restaurarProduto(Number(btn.dataset.restaurar)));
    });
}

function renderizarPaginacaoLixeira(res) {
    const alvo = document.getElementById("paginacao-lixeira");
    if (res.total === 0) {
        alvo.innerHTML = "";
        return;
    }
    alvo.innerHTML = `
        <span>Página ${res.pagina} de ${res.totalPaginas} — ${res.total} produto(s)</span>
        <div class="botoes">
            <button class="pequeno secundario" ${res.pagina <= 1 ? "disabled" : ""} data-pagina="${res.pagina - 1}">‹ Anterior</button>
            <button class="pequeno secundario" ${res.pagina >= res.totalPaginas ? "disabled" : ""} data-pagina="${res.pagina + 1}">Próxima ›</button>
        </div>
    `;
    alvo.querySelectorAll("button[data-pagina]").forEach((btn) => {
        btn.onclick = () => {
            estadoLixeira.pagina = Number(btn.dataset.pagina);
            carregarLixeira();
        };
    });
}

async function abrirFormProduto(id) {
    let produto = {
        nome: "",
        sku: "",
        descricao: "",
        preco: "",
        quantidade: "",
        estoque_minimo: "",
        categoria_id: "",
        ativo: 1
    };
    if (id) {
        try {
            produto = await api(`/produtos/${id}`);
        } catch (e) {
            return UI.toast(e.message, "erro");
        }
    }

    const opcoesCategoria = categoriasCache
        .map(
            (c) =>
                `<option value="${c.id}" ${c.id == produto.categoria_id ? "selected" : ""}>${escapeHtml(c.nome)}</option>`
        )
        .join("");

    const html = `
        <div class="form-grid">
            <div class="campo full">
                <label>Nome do produto <span class="obrigatorio">*</span></label>
                <input name="nome" value="${escapeHtml(produto.nome)}" data-formato="titulo"
                    placeholder="Ex: Notebook Dell Inspiron 15" required />
            </div>
            <div class="campo">
                <label>Código SKU</label>
                <input name="sku" value="${escapeHtml(produto.sku || "")}" data-formato="sku" placeholder="Ex: NB-DELL-15" />
            </div>
            <div class="campo">
                <label>Categoria</label>
                <select name="categoria_id"><option value="">Sem categoria</option>${opcoesCategoria}</select>
            </div>
            <div class="campo">
                <label>Preço (R$) <span class="obrigatorio">*</span></label>
                <input type="number" step="0.01" min="0" name="preco"
                    value="${produto.preco !== "" && produto.preco != null && produto.preco !== 0 ? produto.preco : ""}"
                    placeholder="0,00" required />
            </div>
            <div class="campo">
                <label>Quantidade ${id ? "" : '<span class="obrigatorio">*</span>'}</label>
                <input type="number" min="0" name="quantidade" value="${id ? produto.quantidade : ""}"
                    placeholder="0" ${id ? "disabled" : "required"} />
            </div>
            <div class="campo">
                <label>Estoque mínimo</label>
                <input type="number" min="0" name="estoque_minimo"
                    value="${id ? produto.estoque_minimo || "" : ""}" placeholder="0" />
            </div>
            <div class="campo">
                <label>Status</label>
                <select name="ativo">
                    <option value="1" ${produto.ativo ? "selected" : ""}>Ativo</option>
                    <option value="0" ${!produto.ativo ? "selected" : ""}>Inativo</option>
                </select>
            </div>
            <div class="campo full">
                <label>Descrição</label>
                <textarea name="descricao" rows="3" data-formato="sentenca"
                    placeholder="Detalhes técnicos...">${escapeHtml(produto.descricao || "")}</textarea>
            </div>
        </div>
    `;

    UI.modal(id ? "Editar Produto" : "Novo Produto", html, async (dados) => {
        dados.preco = Number(dados.preco) || 0;
        dados.quantidade = Number(dados.quantidade) || 0;
        dados.estoque_minimo = Number(dados.estoque_minimo) || 0;
        dados.categoria_id = dados.categoria_id ? Number(dados.categoria_id) : null;
        dados.ativo = dados.ativo === "1";
        if (id) {
            delete dados.quantidade;
            await api(`/produtos/${id}`, { method: "PUT", body: JSON.stringify(dados) });
            UI.toast("Produto atualizado!", "sucesso");
        } else {
            await api("/produtos", { method: "POST", body: JSON.stringify(dados) });
            UI.toast("Produto criado!", "sucesso");
        }
        carregarProdutos();
    });
}
window.abrirFormProduto = abrirFormProduto;

function abrirMovimentacao(id, tipo, nome) {
    const label = tipo === "entrada" ? "Entrada" : "Saída";
    const html = `
        <p class="modal-desc">Produto: <strong>${escapeHtml(nome)}</strong></p>
        <div class="form-grid">
            <div class="campo full">
                <label>Quantidade <span class="obrigatorio">*</span></label>
                <input type="number" min="1" step="1" name="quantidade" placeholder="0" required autofocus />
            </div>
            <div class="campo full">
                <label>Observação</label>
                <input name="observacao" data-formato="sentenca" placeholder="Opcional" />
            </div>
        </div>
    `;
    UI.modal(`${label} de Estoque`, html, async (dados) => {
        const quantidade = parseInt(dados.quantidade, 10);
        if (!Number.isInteger(quantidade) || quantidade <= 0)
            throw new Error("Informe um número inteiro maior que zero.");
        await api(`/produtos/${id}/${tipo}`, {
            method: "PATCH",
            body: JSON.stringify({ quantidade, observacao: dados.observacao || null })
        });
        UI.toast(`${label} de ${quantidade} un. registrada!`, "sucesso");
        carregarProdutos();
    });
}
window.abrirMovimentacao = abrirMovimentacao;

async function removerProduto(id) {
    const ok = await UI.confirmar(`Mover o produto #${id} para a lixeira?`, {
        titulo: "Mover para lixeira",
        tipo: "alerta",
        textoConfirmar: "Mover"
    });
    if (!ok) return;
    try {
        await api(`/produtos/${id}`, { method: "DELETE" });
        UI.toast("Produto movido para a lixeira.", "sucesso");
        carregarProdutos();
        atualizarBadgeLixeira();
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}

async function restaurarProduto(id) {
    const ok = await UI.confirmar(`Restaurar o produto #${id}?`, {
        titulo: "Restaurar produto",
        tipo: "sucesso",
        textoConfirmar: "Restaurar"
    });
    if (!ok) return;
    try {
        await api(`/produtos/${id}/restaurar`, { method: "POST" });
        UI.toast("Produto restaurado!", "sucesso");
        carregarLixeira();
        atualizarBadgeLixeira();
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}
window.restaurarProduto = restaurarProduto;

async function esvaziarLixeira() {
    if (!Auth.admin()) return UI.toast("Apenas administradores podem esvaziar a lixeira.", "erro");
    const { total } = await api("/produtos/lixeira/count").catch(() => ({ total: 0 }));
    if (total === 0) return UI.toast("A lixeira já está vazia.", "info");
    const ok = await UI.confirmar(
        `Esvaziar a lixeira permanentemente?\n\n${total} produto(s) serão APAGADOS DEFINITIVAMENTE.`,
        { titulo: "🧹 Esvaziar Lixeira", tipo: "perigo", textoConfirmar: "Esvaziar" }
    );
    if (!ok) return;
    try {
        const r = await api("/produtos/lixeira/esvaziar", { method: "POST" });
        UI.toast(`${r.removidos} produto(s) apagado(s).`, "sucesso");
        carregarLixeira();
        atualizarBadgeLixeira();
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}
window.esvaziarLixeira = esvaziarLixeira;

let timerBusca;
document.getElementById("filtro-busca").addEventListener("input", (e) => {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(() => {
        estado.busca = e.target.value.trim();
        estado.pagina = 1;
        carregarProdutos();
    }, 350);
});
document.getElementById("filtro-categoria").addEventListener("change", (e) => {
    estado.categoria_id = e.target.value;
    estado.pagina = 1;
    carregarProdutos();
});
document.getElementById("filtro-status").addEventListener("change", (e) => {
    estado.status = e.target.value;
    estado.pagina = 1;
    carregarProdutos();
});

function exportarCSV() {
    if (!ultimoResultado) return;
    const linhas = [
        ["ID", "Nome", "SKU", "Categoria", "Preço", "Quantidade", "Estoque Mínimo", "Ativo"],
        ...ultimoResultado.itens.map((p) => [
            p.id,
            p.nome,
            p.sku || "",
            p.categoria_nome || "",
            p.preco,
            p.quantidade,
            p.estoque_minimo,
            p.ativo ? "Sim" : "Não"
        ])
    ];
    const csv = linhas.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `produtos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast("CSV exportado!", "sucesso");
}
window.exportarCSV = exportarCSV;

if (typeof Socket !== "undefined") {
    Socket.on("produto:criado", () => {
        if (modoAtual === "ativos") carregarProdutos();
    });
    Socket.on("produto:atualizado", () => {
        if (modoAtual === "ativos") carregarProdutos();
        else carregarLixeira();
    });
    Socket.on("produto:removido", () => {
        if (modoAtual === "ativos") carregarProdutos();
        else carregarLixeira();
        atualizarBadgeLixeira();
    });
    Socket.on("produto:movimentado", () => {
        if (modoAtual === "ativos") carregarProdutos();
    });
}

(async () => {
    await carregarCategorias();
    await carregarProdutos();
    atualizarBadgeLixeira();
})();
