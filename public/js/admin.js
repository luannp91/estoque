if (!Auth.exigirLogin()) throw new Error("não logado");

if (!Auth.admin()) {
    alert("Acesso restrito a administradores.");
    window.location.href = "dashboard.html";
    throw new Error("não autorizado");
}

document.getElementById("topbar").innerHTML = UI.montarTopbar("admin");

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// ===================== ESTADO =====================
const estado = { pagina: 1, limite: 10, ordenar: "nome", ordem: "asc", busca: "", papel: "", ativo: "" };
let ultimoResultado = null;

// ===================== ESTATÍSTICAS =====================
async function carregarEstatisticas() {
    try {
        const r = await api("/admin/estatisticas");
        document.getElementById("stats-admin").innerHTML = `
            <div class="stat"><div class="rotulo">Total de Usuários</div><div class="valor">${r.total_usuarios ?? r.total ?? 0}</div></div>
            <div class="stat sucesso"><div class="rotulo">Admins</div><div class="valor">${r.admins ?? 0}</div></div>
            <div class="stat"><div class="rotulo">Operadores</div><div class="valor">${r.operadores ?? 0}</div></div>
            <div class="stat"><div class="rotulo">Ativos</div><div class="valor">${r.ativos ?? 0}</div></div>
            <div class="stat alerta"><div class="rotulo">Inativos</div><div class="valor">${r.inativos ?? 0}</div></div>
            ${r.super_admins > 0 ? `<div class="stat sucesso"><div class="rotulo">Super-admins</div><div class="valor">${r.super_admins}</div></div>` : ""}
            ${r.com_2fa !== undefined ? `<div class="stat"><div class="rotulo">Com 2FA</div><div class="valor">${r.com_2fa}</div></div>` : ""}
        `;
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}

// ===================== USUÁRIOS =====================
async function carregarUsuarios() {
    const params = new URLSearchParams({
        pagina: estado.pagina,
        limite: estado.limite,
        ordenar: estado.ordenar,
        ordem: estado.ordem
    });
    if (estado.busca) params.set("busca", estado.busca);
    if (estado.papel) params.set("papel", estado.papel);
    if (estado.ativo) params.set("ativo", estado.ativo);

    try {
        ultimoResultado = await api(`/admin/usuarios?${params}`);
        renderizarTabela(ultimoResultado);
        renderizarPaginacao(ultimoResultado);
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}

function renderizarTabela(res) {
    const alvo = document.getElementById("tabela");
    if (!res.itens.length) {
        alvo.innerHTML = '<p class="sem-dados">Nenhum usuário encontrado.</p>';
        return;
    }
    const meuId = Auth.usuario().id;

    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr>
                        <th data-ord="id">ID</th>
                        <th data-ord="nome">Nome</th>
                        <th data-ord="email">E-mail</th>
                        <th data-ord="papel">Papel</th>
                        <th>Status</th>
                        <th>2FA</th>
                        <th>Último login</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${res.itens
                        .map((u) => {
                            const ehSelf = u.id === meuId;
                            return `
                            <tr>
                                <td>${u.id}</td>
                                <td>${escapeHtml(u.nome)} ${ehSelf ? '<span class="badge azul">você</span>' : ""}</td>
                                <td>${escapeHtml(u.email)}</td>
                                <td><span class="badge ${u.papel === "admin" ? "azul" : "cinza"}">${u.papel}</span></td>
                                <td>${u.ativo ? '<span class="badge verde">ativo</span>' : '<span class="badge vermelho">inativo</span>'}</td>
                                <td>${u.totp_ativo ? '<span class="badge verde">🔒 ON</span>' : '<span class="badge cinza">OFF</span>'}</td>
                                <td>${u.ultimo_login ? UI.formatarData(u.ultimo_login) : "—"}</td>
                                <td>
                                    <div class="acao">
                                        <button class="pequeno secundario" data-editar='${JSON.stringify(u)}'>✏</button>
                                        <button class="pequeno secundario" data-resetar="${u.id}" data-nome="${escapeHtml(u.nome)}">🔑</button>
                                        ${!ehSelf ? `<button class="pequeno perigo" data-remover="${u.id}" data-nome="${escapeHtml(u.nome)}">🗑</button>` : ""}
                                    </div>
                                </td>
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
                .map((u) => {
                    const ehSelf = u.id === meuId;
                    return `
                    <div class="item-card">
                        <div class="item-card-header">
                            <div class="item-card-titulo">
                                <span class="item-card-id">#${u.id}</span>
                                <span class="item-card-nome">${escapeHtml(u.nome)}</span>
                            </div>
                            <span class="badge ${u.ativo ? "verde" : "vermelho"}">${u.ativo ? "ativo" : "inativo"}</span>
                        </div>
                        <div class="item-card-info">
                            ${ehSelf ? '<div class="info-linha"><span class="info-label">Você</span><span class="info-valor"><span class="badge azul">este usuário</span></span></div>' : ""}
                            <div class="info-linha"><span class="info-label">E-mail</span><span class="info-valor">${escapeHtml(u.email)}</span></div>
                            <div class="info-linha"><span class="info-label">Papel</span><span class="info-valor"><span class="badge ${u.papel === "admin" ? "azul" : "cinza"}">${u.papel}</span></span></div>
                            <div class="info-linha"><span class="info-label">2FA</span><span class="info-valor">${u.totp_ativo ? "🔒 Ativado" : "Desativado"}</span></div>
                            ${u.ultimo_login ? `<div class="info-linha"><span class="info-label">Último login</span><span class="info-valor">${UI.formatarData(u.ultimo_login)}</span></div>` : ""}
                        </div>
                        <div class="item-card-actions">
                            <button class="pequeno secundario" data-editar='${JSON.stringify(u)}'>✏ Editar</button>
                            <button class="pequeno secundario" data-resetar="${u.id}" data-nome="${escapeHtml(u.nome)}">🔑 Senha</button>
                            ${!ehSelf ? `<button class="pequeno perigo" data-remover="${u.id}" data-nome="${escapeHtml(u.nome)}">🗑</button>` : ""}
                        </div>
                    </div>
                `;
                })
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
            carregarUsuarios();
        };
    });

    alvo.querySelectorAll("button[data-editar]").forEach((btn) => {
        btn.onclick = () => abrirFormUsuario(JSON.parse(btn.dataset.editar));
    });
    alvo.querySelectorAll("button[data-resetar]").forEach((btn) => {
        btn.onclick = () => resetarSenha(Number(btn.dataset.resetar), btn.dataset.nome);
    });
    alvo.querySelectorAll("button[data-remover]").forEach((btn) => {
        btn.onclick = () => removerUsuario(Number(btn.dataset.remover), btn.dataset.nome);
    });
}

function renderizarPaginacao(res) {
    document.getElementById("paginacao").innerHTML = `
        <span>Página ${res.pagina} de ${res.totalPaginas} — ${res.total} usuário(s)</span>
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
                carregarUsuarios();
            };
        });
}

// ===================== FORM USUÁRIO =====================
function abrirFormUsuario(usuario = null) {
    const editando = !!usuario;
    const u = usuario || { nome: "", email: "", papel: "operador", ativo: 1 };

    const campoSenha = editando
        ? ""
        : `
        <div class="campo full">
            <label>Senha inicial <span class="obrigatorio">*</span></label>
            <input type="password" name="senha" minlength="8"
                placeholder="Mín. 8 chars, com A-z, 0-9 e símbolo" required />
            <span class="campo-hint">Deve ter maiúscula, minúscula, número e caractere especial.</span>
        </div>
    `;

    const html = `
        <div class="form-grid">
            <div class="campo full">
                <label>Nome completo <span class="obrigatorio">*</span></label>
                <input name="nome" value="${escapeHtml(u.nome)}" data-formato="titulo"
                    placeholder="Ex: João da Silva" required />
            </div>
            <div class="campo full">
                <label>E-mail <span class="obrigatorio">*</span></label>
                <input type="email" name="email" value="${escapeHtml(u.email)}" data-formato="email"
                    placeholder="usuario@empresa.com" required />
            </div>
            <div class="campo">
                <label>Papel <span class="obrigatorio">*</span></label>
                <select name="papel">
                    <option value="operador" ${u.papel === "operador" ? "selected" : ""}>Operador</option>
                    <option value="admin" ${u.papel === "admin" ? "selected" : ""}>Administrador</option>
                </select>
            </div>
            <div class="campo">
                <label>Status</label>
                <select name="ativo">
                    <option value="1" ${u.ativo ? "selected" : ""}>Ativo</option>
                    <option value="0" ${!u.ativo ? "selected" : ""}>Inativo</option>
                </select>
            </div>
            ${campoSenha}
        </div>
    `;

    UI.modal(editando ? "Editar Usuário" : "Novo Usuário", html, async (dados) => {
        dados.ativo = dados.ativo === "1";
        if (editando) {
            await api(`/admin/usuarios/${u.id}`, { method: "PUT", body: JSON.stringify(dados) });
            UI.toast("Usuário atualizado!", "sucesso");
        } else {
            await api("/admin/usuarios", { method: "POST", body: JSON.stringify(dados) });
            UI.toast("Usuário criado!", "sucesso");
        }
        carregarEstatisticas();
        carregarUsuarios();
    });
}
window.abrirFormUsuario = abrirFormUsuario;

function resetarSenha(id, nome) {
    const html = `
        <p class="modal-desc">Usuário: <strong>${escapeHtml(nome)}</strong></p>
        <div class="form-grid">
            <div class="campo full">
                <label>Nova senha <span class="obrigatorio">*</span></label>
                <input type="password" name="novaSenha" minlength="8"
                    placeholder="Mín. 8 chars, com A-z, 0-9 e símbolo" required autofocus />
                <span class="campo-hint">Deve ter maiúscula, minúscula, número e caractere especial.</span>
            </div>
        </div>
    `;
    UI.modal("Redefinir Senha", html, async (dados) => {
        await api(`/admin/usuarios/${id}/senha`, {
            method: "PATCH",
            body: JSON.stringify({ novaSenha: dados.novaSenha })
        });
        UI.toast("Senha redefinida!", "sucesso");
    });
}

async function removerUsuario(id, nome) {
    const ok = await UI.confirmar(`Remover permanentemente o usuário "${nome}"? Esta ação não pode ser desfeita.`, {
        titulo: "Remover usuário",
        tipo: "perigo",
        textoConfirmar: "Remover"
    });
    if (!ok) return;
    try {
        await api(`/admin/usuarios/${id}`, { method: "DELETE" });
        UI.toast("Usuário removido.", "sucesso");
        carregarEstatisticas();
        carregarUsuarios();
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}

// ===================== BACKUP =====================
async function carregarInfoBackup() {
    try {
        const info = await api("/admin/backup/info");
        document.getElementById("backup-info").innerHTML = `
            <div class="stats-grid">
                <div class="stat"><div class="rotulo">Tamanho</div><div class="valor">${info.tamanho_legivel}</div></div>
                <div class="stat"><div class="rotulo">Produtos</div><div class="valor">${info.registros.produtos}</div></div>
                <div class="stat"><div class="rotulo">Movimentações</div><div class="valor">${info.registros.movimentacoes}</div></div>
                <div class="stat"><div class="rotulo">Usuários</div><div class="valor">${info.registros.usuarios}</div></div>
                <div class="stat"><div class="rotulo">Última alteração</div><div class="valor" style="font-size:1rem">${UI.formatarData(info.modificado_em)}</div></div>
            </div>
        `;
        renderizarListaBackups(info.backups);
    } catch (e) {
        document.getElementById("backup-info").innerHTML =
            `<p class="sem-dados">Não foi possível carregar as informações.</p>`;
    }
}

function renderizarListaBackups(backups) {
    const alvo = document.getElementById("lista-backups");
    if (!backups.length) {
        alvo.innerHTML = `<p class="sem-dados">Nenhum backup salvo em <code>backups/</code> ainda.</p>`;
        return;
    }

    const totalCifrados = backups.filter((b) => b.criptografado).length;
    const totalAntigos = backups.length - totalCifrados;

    const resumo = `
        <p style="font-size:.85rem;color:var(--texto-suave);margin-bottom:.75rem">
            ${backups.length} backup(s) —
            <strong>${totalCifrados} criptografado(s)</strong>
            ${totalAntigos ? ` • ${totalAntigos} antigo(s) sem criptografia` : ""}
        </p>
    `;

    const tabela = `
        <div class="tabela-desktop tabela-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Arquivo</th>
                        <th>Tipo</th>
                        <th>Segurança</th>
                        <th>Tamanho</th>
                        <th>Data</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${backups
                        .map(
                            (b) => `
                        <tr>
                            <td>${escapeHtml(b.nome)}</td>
                            <td><span class="badge ${b.tipo === "automatico" ? "azul" : "verde"}">${b.tipo}</span></td>
                            <td>
                                ${
                                    b.criptografado
                                        ? '<span class="badge verde">🔒 AES-256</span>'
                                        : '<span class="badge amarelo">⚠️ aberto</span>'
                                }
                            </td>
                            <td>${b.tamanho_legivel}</td>
                            <td>${UI.formatarData(b.modificado_em)}</td>
                            <td>
                                <div class="acao">
                                    <button class="pequeno secundario" data-baixar="${escapeHtml(b.nome)}">⬇</button>
                                    <button class="pequeno perigo" data-remover-backup="${escapeHtml(b.nome)}">🗑</button>
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
            ${backups
                .map(
                    (b) => `
                <div class="item-card">
                    <div class="item-card-header">
                        <div class="item-card-titulo">
                            <span class="item-card-nome" style="font-size:0.85rem">${escapeHtml(b.nome)}</span>
                        </div>
                        <span class="badge ${b.criptografado ? "verde" : "amarelo"}">
                            ${b.criptografado ? "🔒" : "⚠️"} ${b.tipo}
                        </span>
                    </div>
                    <div class="item-card-info">
                        <div class="info-linha"><span class="info-label">Segurança</span><span class="info-valor">${b.criptografado ? "🔒 AES-256-GCM" : "⚠️ Sem criptografia"}</span></div>
                        <div class="info-linha"><span class="info-label">Tamanho</span><span class="info-valor">${b.tamanho_legivel}</span></div>
                        <div class="info-linha"><span class="info-label">Data</span><span class="info-valor">${UI.formatarData(b.modificado_em)}</span></div>
                    </div>
                    <div class="item-card-actions">
                        <button class="pequeno secundario" data-baixar="${escapeHtml(b.nome)}">⬇ Baixar</button>
                        <button class="pequeno perigo" data-remover-backup="${escapeHtml(b.nome)}">🗑</button>
                    </div>
                </div>
            `
                )
                .join("")}
        </div>
    `;

    alvo.innerHTML = resumo + tabela + cards;

    alvo.querySelectorAll("button[data-baixar]").forEach((btn) => {
        btn.onclick = () => baixarBackupSalvo(btn.dataset.baixar);
    });
    alvo.querySelectorAll("button[data-remover-backup]").forEach((btn) => {
        btn.onclick = () => removerBackup(btn.dataset.removerBackup);
    });
}

async function baixarBackup() {
    try {
        UI.toast("Preparando snapshot...", "info");
        const resp = await fetch("/api/admin/backup", {
            headers: { Authorization: `Bearer ${Auth.token()}` }
        });
        if (!resp.ok) {
            const erro = await resp.json().catch(() => ({ erro: "Falha ao gerar backup." }));
            throw new Error(erro.erro);
        }
        const cd = resp.headers.get("Content-Disposition") || "";
        const match = cd.match(/filename="?([^"]+)"?/);
        const nome = match ? match[1] : `estoque-backup-${Date.now()}.db.cifrado`;
        await _downloadBlob(await resp.blob(), nome);
        UI.toast(`Baixado: ${nome}`, "sucesso");
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}
window.baixarBackup = baixarBackup;

async function criarBackupManual() {
    try {
        UI.toast("Gerando e criptografando backup...", "info");

        const b = await api("/admin/backup/criar", { method: "POST" });

        UI.toast(`✅ Backup salvo: ${b.nome} (${b.tamanho_legivel})`, "sucesso", 6000);

        // Recarrega a lista para mostrar o novo arquivo
        await carregarInfoBackup();
    } catch (e) {
        console.error("[backup] Erro:", e);
        UI.toast(e.message || "Falha ao gerar backup.", "erro");
    }
}
window.criarBackupManual = criarBackupManual;

function baixarBackupSalvo(nome) {
    fetch(`/api/admin/backup/${encodeURIComponent(nome)}/baixar`, {
        headers: { Authorization: `Bearer ${Auth.token()}` }
    })
        .then(async (r) => {
            if (!r.ok) throw new Error("Falha ao baixar.");
            await _downloadBlob(await r.blob(), nome);
            UI.toast("Download iniciado.", "sucesso");
        })
        .catch((e) => UI.toast(e.message, "erro"));
}

async function removerBackup(nome) {
    const ok = await UI.confirmar(`Remover o backup "${nome}"?`, {
        titulo: "Remover backup",
        tipo: "perigo",
        textoConfirmar: "Remover"
    });
    if (!ok) return;
    try {
        await api(`/admin/backup/${encodeURIComponent(nome)}`, { method: "DELETE" });
        UI.toast("Backup removido.", "sucesso");
        carregarInfoBackup();
    } catch (e) {
        UI.toast(e.message, "erro");
    }
}

async function _downloadBlob(blob, nome) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// ===================== RESTORE =====================
async function validarRestore() {
    const input = document.getElementById("arquivo-restore");
    const alvo = document.getElementById("restore-info");
    if (!input.files[0]) return UI.toast("Selecione um arquivo .db ou .cifrado.", "erro");

    const form = new FormData();
    form.append("arquivo", input.files[0]);

    try {
        const resp = await fetch("/api/admin/restore/validar", {
            method: "POST",
            headers: { Authorization: `Bearer ${Auth.token()}` },
            body: form
        });
        const dados = await resp.json();
        if (!resp.ok) throw new Error(dados.erro);

        const criptoBadge = dados.era_criptografado
            ? '<span class="badge verde">🔒 Criptografado AES-256</span>'
            : '<span class="badge amarelo">⚠️ Sem criptografia</span>';

        alvo.innerHTML = `
            <div class="card" style="background:var(--bg)">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;margin-bottom:.5rem">
                    <strong>✅ Arquivo válido:</strong>
                    ${criptoBadge}
                </div>
                <span style="color:var(--texto-suave);font-size:.9rem">
                    <strong>${escapeHtml(dados.arquivo)}</strong><br>
                    Usuários: ${dados.info.counts.usuarios} •
                    Categorias: ${dados.info.counts.categorias} •
                    Produtos: ${dados.info.counts.produtos} •
                    Movimentações: ${dados.info.counts.movimentacoes}
                </span>
            </div>
        `;
        UI.toast("Arquivo válido. Pode restaurar.", "sucesso");
    } catch (e) {
        alvo.innerHTML = `<div class="card" style="background:var(--bg); border-color:#fecaca"><strong>❌ Erro:</strong> ${escapeHtml(e.message)}</div>`;
        UI.toast(e.message, "erro");
    }
}
window.validarRestore = validarRestore;

async function restaurarBackup() {
    const input = document.getElementById("arquivo-restore");
    if (!input.files[0]) return UI.toast("Selecione um arquivo .db ou .cifrado.", "erro");

    const ok = await UI.confirmar(
        "Isso vai SUBSTITUIR todos os dados atuais pelo conteúdo do arquivo.\n\nUm backup de segurança será criado automaticamente antes.\n\nDeseja continuar?",
        { titulo: "⚠️ Restaurar banco de dados", tipo: "alerta", textoConfirmar: "Restaurar" }
    );
    if (!ok) return;

    const form = new FormData();
    form.append("arquivo", input.files[0]);

    const overlay = UI.overlayCarregando("Restaurando banco...");

    try {
        const resp = await fetch("/api/admin/restore", {
            method: "POST",
            headers: { Authorization: `Bearer ${Auth.token()}` },
            body: form
        });
        const dados = await resp.json();
        if (!resp.ok) throw new Error(dados.erro);

        overlay.atualizar("Concluído!");
        setTimeout(() => {
            overlay.fechar();
            alert(
                `✅ Restauração concluída!\n\n` +
                    `${dados.arquivo_era_criptografado ? "(Arquivo estava criptografado e foi descriptografado)\n\n" : ""}` +
                    `Backup de segurança: ${dados.info.backup_seguranca}\n\n` +
                    `Você será desconectado para fazer login novamente.`
            );
            Auth.limpar();
            window.location.href = "index.html";
        }, 500);
    } catch (e) {
        overlay.fechar();
        UI.toast(e.message, "erro");
    }
}
window.restaurarBackup = restaurarBackup;

// ===================== FILTROS =====================
let timerBusca;
document.getElementById("filtro-busca").addEventListener("input", (e) => {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(() => {
        estado.busca = e.target.value.trim();
        estado.pagina = 1;
        carregarUsuarios();
    }, 350);
});
document.getElementById("filtro-papel").addEventListener("change", (e) => {
    estado.papel = e.target.value;
    estado.pagina = 1;
    carregarUsuarios();
});
document.getElementById("filtro-ativo").addEventListener("change", (e) => {
    estado.ativo = e.target.value;
    estado.pagina = 1;
    carregarUsuarios();
});

// ===================== INIT =====================
carregarEstatisticas();
carregarUsuarios();
carregarInfoBackup();
