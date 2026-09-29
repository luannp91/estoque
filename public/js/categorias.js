if (!Auth.exigirLogin()) throw new Error("não logado");
document.getElementById("topbar").innerHTML = UI.montarTopbar("categorias");

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

async function carregar() {
    try {
        renderizar(await api("/categorias"));
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}

function renderizar(lista) {
    const alvo = document.getElementById("tabela");
    if (!lista.length) {
        alvo.innerHTML = '<p class="sem-dados">Nenhuma categoria cadastrada.</p>';
        return;
    }

    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr><th>ID</th><th>Nome</th><th>Descrição</th><th>Produtos</th><th>Ações</th></tr>
                </thead>
                <tbody>
                    ${lista
                        .map(
                            (c) => `
                        <tr>
                            <td>${c.id}</td>
                            <td>${escapeHtml(c.nome)}</td>
                            <td>${escapeHtml(c.descricao || "—")}</td>
                            <td><span class="badge azul">${c.total_produtos}</span></td>
                            <td>
                                <div class="acao">
                                    <button class="pequeno secundario" data-editar='${JSON.stringify({ id: c.id, nome: c.nome, descricao: c.descricao || "" })}'>✏</button>
                                    ${Auth.admin() ? `<button class="pequeno perigo" data-remover="${c.id}" data-nome="${escapeHtml(c.nome)}">🗑</button>` : ""}
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
            ${lista
                .map(
                    (c) => `
                <div class="item-card">
                    <div class="item-card-header">
                        <div class="item-card-titulo">
                            <span class="item-card-id">#${c.id}</span>
                            <span class="item-card-nome">${escapeHtml(c.nome)}</span>
                        </div>
                        <span class="badge azul">${c.total_produtos} prod.</span>
                    </div>
                    ${c.descricao ? `<div class="item-card-info"><div class="info-linha"><span class="info-label">Descrição</span><span class="info-valor">${escapeHtml(c.descricao)}</span></div></div>` : ""}
                    <div class="item-card-actions">
                        <button class="pequeno secundario" data-editar='${JSON.stringify({ id: c.id, nome: c.nome, descricao: c.descricao || "" })}'>✏ Editar</button>
                        ${Auth.admin() ? `<button class="pequeno perigo" data-remover="${c.id}" data-nome="${escapeHtml(c.nome)}">🗑</button>` : ""}
                    </div>
                </div>
            `
                )
                .join("")}
        </div>
    `;

    alvo.innerHTML = tabela + cards;

    alvo.querySelectorAll("button[data-editar]").forEach((btn) => {
        btn.onclick = () => abrirFormCategoria(JSON.parse(btn.dataset.editar));
    });
    alvo.querySelectorAll("button[data-remover]").forEach((btn) => {
        btn.onclick = () => remover(Number(btn.dataset.remover), btn.dataset.nome);
    });
}

function abrirFormCategoria(categoria = null) {
    const editando = !!categoria;
    const c = categoria || { nome: "", descricao: "" };

    const html = `
        <div class="form-grid">
            <div class="campo full">
                <label>Nome da categoria <span class="obrigatorio">*</span></label>
                <input name="nome" value="${escapeHtml(c.nome)}" data-formato="titulo"
                    placeholder="Ex: Informática, Escritório..." required />
            </div>
            <div class="campo full">
                <label>Descrição</label>
                <textarea name="descricao" rows="3" data-formato="sentenca"
                    placeholder="Breve descrição...">${escapeHtml(c.descricao || "")}</textarea>
            </div>
        </div>
    `;

    UI.modal(editando ? "Editar Categoria" : "Nova Categoria", html, async (dados) => {
        if (editando) {
            await api(`/categorias/${c.id}`, { method: "PUT", body: JSON.stringify(dados) });
            UI.toast("Categoria atualizada!", "sucesso");
        } else {
            await api("/categorias", { method: "POST", body: JSON.stringify(dados) });
            UI.toast("Categoria criada!", "sucesso");
        }
        carregar();
    });
}
window.abrirFormCategoria = abrirFormCategoria;

async function remover(id, nome) {
    const ok = await UI.confirmar(`Remover a categoria "${nome}"?\n\nOs produtos vinculados ficarão sem categoria.`, {
        titulo: "Remover categoria",
        tipo: "perigo",
        textoConfirmar: "Remover"
    });
    if (!ok) return;
    try {
        await api(`/categorias/${id}`, { method: "DELETE" });
        UI.toast("Categoria removida.", "sucesso");
        carregar();
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}

carregar();
