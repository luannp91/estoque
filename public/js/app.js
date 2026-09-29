// ===================== AUTH =====================
const TOKEN_KEY = "estoque_token";
const USER_KEY = "estoque_usuario";

const Auth = {
    token: () => localStorage.getItem(TOKEN_KEY),
    usuario: () => JSON.parse(localStorage.getItem(USER_KEY) || "null"),
    salvar: ({ token, usuario }) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    },
    limpar: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
    logado: () => !!localStorage.getItem(TOKEN_KEY),

    // ============ PAPÉIS ============
    papel: () => JSON.parse(localStorage.getItem(USER_KEY) || "{}").papel || null,
    operador: () => {
        const p = Auth.papel();
        return p === "operador" || p === "admin" || p === "super_admin";
    },
    admin: () => {
        const p = Auth.papel();
        return p === "admin" || p === "super_admin";
    },
    superAdmin: () => Auth.papel() === "super_admin",

    // ============ GUARDS ============
    exigirLogin: () => {
        if (!Auth.logado()) {
            window.location.href = "index.html";
            return false;
        }
        return true;
    },
    exigirAdmin: () => {
        if (!Auth.logado()) {
            window.location.href = "index.html";
            return false;
        }
        if (!Auth.admin()) {
            window.location.href = "dashboard.html";
            return false;
        }
        return true;
    },
    exigirSuperAdmin: () => {
        if (!Auth.logado()) {
            window.location.href = "index.html";
            return false;
        }
        if (!Auth.superAdmin()) {
            window.location.href = "dashboard.html";
            return false;
        }
        return true;
    }
};

// ===================== API =====================
function estaNaPaginaLogin() {
    const path = window.location.pathname.toLowerCase();
    return path === "/" || path.endsWith("/index.html") || path.endsWith("index.html");
}

async function api(url, opcoes = {}) {
    const headers = { "Content-Type": "application/json", ...(opcoes.headers || {}) };
    const token = Auth.token();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const resp = await fetch(`/api${url}`, { ...opcoes, headers });

    // 🔑 Rotas de autenticação têm tratamento próprio
    const ehRotaDeAutenticacao =
        url.includes("/auth/login") || url.includes("/auth/registrar") || url.includes("/auth/2fa");

    if (resp.status === 401) {
        // Se NÃO é login, é sessão expirada mesmo
        if (!ehRotaDeAutenticacao) {
            Auth.limpar();
            if (!estaNaPaginaLogin()) window.location.href = "index.html";
            throw new Error("Sessão expirada.");
        }

        // Se é login, mostra o erro REAL vindo do backend
        const erro = await resp.json().catch(() => ({}));
        throw new Error(erro.erro || "E-mail ou senha inválidos.");
    }

    // Rate limit
    if (resp.status === 429) {
        const erro = await resp.json().catch(() => ({}));
        throw new Error(erro.erro || "Muitas tentativas. Aguarde alguns minutos.");
    }

    if (!resp.ok) {
        const erro = await resp.json().catch(() => ({ erro: "Erro desconhecido" }));
        throw new Error(erro.erro || "Erro na requisição.");
    }

    return resp.status === 204 ? null : resp.json();
}

// ===================== FORMAT =====================
const SIGLAS_CONHECIDAS = new Set([
    "SSD",
    "HDD",
    "NVME",
    "SATA",
    "CPU",
    "GPU",
    "RAM",
    "ROM",
    "DDR",
    "DDR2",
    "DDR3",
    "DDR4",
    "DDR5",
    "RTX",
    "GTX",
    "PSU",
    "ATX",
    "MATX",
    "ITX",
    "USB",
    "HDMI",
    "VGA",
    "DVI",
    "DP",
    "RJ45",
    "LCD",
    "LED",
    "OLED",
    "QLED",
    "IPS",
    "TN",
    "VA",
    "GB",
    "TB",
    "MB",
    "KB",
    "MHZ",
    "GHZ",
    "DPI",
    "WIFI",
    "LAN",
    "WAN",
    "IP",
    "RGB",
    "ARGB"
]);

const Format = {
    _protegerSiglas(texto) {
        const siglas = [];
        const protegido = String(texto).replace(/\p{L}+/gu, (palavra) => {
            const upper = palavra.toUpperCase();
            if (SIGLAS_CONHECIDAS.has(upper)) {
                const idx = siglas.push(upper) - 1;
                return `\u0001${idx}\u0001`;
            }
            if (/^[A-ZÀ-Ý]{2,5}$/.test(palavra)) {
                const idx = siglas.push(palavra) - 1;
                return `\u0001${idx}\u0001`;
            }
            return palavra;
        });
        return { protegido, siglas };
    },
    _restaurarSiglas(texto, siglas) {
        return String(texto).replace(/\u0001(\d+)\u0001/g, (m, i) => siglas[Number(i)]);
    },
    titulo(texto) {
        if (texto === null || texto === undefined) return "";
        const conectores = ["da", "de", "do", "das", "dos", "e", "a", "o", "em", "com", "para", "por"];
        let t = String(texto).trim().replace(/\s+/g, " ");
        const { protegido, siglas } = this._protegerSiglas(t);
        t = protegido
            .toLowerCase()
            .split(" ")
            .map((palavra, i) => {
                if (i === 0) return palavra.charAt(0).toUpperCase() + palavra.slice(1);
                if (conectores.includes(palavra)) return palavra;
                return palavra.replace(
                    /(^|[-'/])([a-záéíóúâêôãõçàüñ])/gi,
                    (m, sep, letra) => sep + letra.toUpperCase()
                );
            })
            .join(" ");
        return this._restaurarSiglas(t, siglas);
    },
    sentenca(texto) {
        if (texto === null || texto === undefined) return null;
        let t = String(texto).trim().replace(/\s+/g, " ");
        if (!t) return null;
        const { protegido, siglas } = this._protegerSiglas(t);
        t = protegido.toLowerCase();
        t = t.replace(/(^|[.!?:]\s+)([a-záéíóúâêôãõçàüñ])/gi, (m, sep, letra) => sep + letra.toUpperCase());
        return this._restaurarSiglas(t, siglas);
    },
    capitalizar(texto) {
        if (!texto) return "";
        const t = String(texto).trim().replace(/\s+/g, " ");
        const { protegido, siglas } = this._protegerSiglas(t);
        const resultado = protegido.charAt(0).toUpperCase() + protegido.slice(1).toLowerCase();
        return this._restaurarSiglas(resultado, siglas);
    },
    limpar(texto) {
        return !texto ? "" : String(texto).trim().replace(/\s+/g, " ");
    },
    email(texto) {
        return !texto ? "" : String(texto).trim().toLowerCase();
    },
    sku(texto) {
        if (!texto) return "";
        return String(texto)
            .trim()
            .toUpperCase()
            .replace(/[\s_]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    },
    numero(texto) {
        if (texto === null || texto === undefined || texto === "") return "";
        let s = String(texto).trim();
        if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
        const n = Number(s);
        return isNaN(n) ? "" : n;
    },
    maiusculo(texto) {
        return texto ? String(texto).trim().toUpperCase() : "";
    },
    minusculo(texto) {
        return texto ? String(texto).trim().toLowerCase() : "";
    },
    aplicar(input) {
        if (!input || !input.dataset) return;
        const tipo = input.dataset.formato;
        if (!tipo || typeof Format[tipo] !== "function") return;
        if (input.disabled || input.readOnly) return;
        const valorAntes = input.value;
        if (!valorAntes) return;
        const valorDepois = Format[tipo](valorAntes);
        if (valorAntes !== valorDepois && valorDepois !== null && valorDepois !== undefined) {
            input.value = valorDepois;
        }
    },
    aplicarNoForm(form) {
        const dados = {};
        form.querySelectorAll("input, select, textarea").forEach((el) => {
            if (!el.name || el.disabled) return;
            Format.aplicar(el);
            dados[el.name] = el.type === "checkbox" ? el.checked : el.value;
        });
        return dados;
    }
};

// ===================== UI =====================
const UI = {
    toast(texto, tipo = "info", duracao = 4000) {
        let container = document.querySelector(".toasts");
        if (!container) {
            container = document.createElement("div");
            container.className = "toasts";
            document.body.appendChild(container);
        }
        const icones = { sucesso: "✓", erro: "✕", aviso: "!", info: "i" };
        const el = document.createElement("div");
        el.className = `toast ${tipo}`;
        el.innerHTML = `
            <div class="toast-icon">${icones[tipo] || "i"}</div>
            <div class="toast-content"><div class="toast-text"></div></div>
            <button class="toast-close" aria-label="Fechar">✕</button>
            <div class="toast-progress" style="animation-duration:${duracao}ms"></div>
        `;
        el.querySelector(".toast-text").textContent = texto;
        container.appendChild(el);
        const remover = () => {
            if (el.classList.contains("saindo")) return;
            el.classList.add("saindo");
            setTimeout(() => el.remove(), 200);
        };
        el.querySelector(".toast-close").onclick = remover;
        const timeout = setTimeout(remover, duracao);
        el.addEventListener("mouseenter", () => {
            clearTimeout(timeout);
            const barra = el.querySelector(".toast-progress");
            if (barra) barra.style.animationPlayState = "paused";
        });
        el.addEventListener("mouseleave", () => {
            const barra = el.querySelector(".toast-progress");
            if (barra) barra.style.animationPlayState = "running";
            setTimeout(remover, 1000);
        });
    },

    confirmar(mensagem, opcoes = {}) {
        return new Promise((resolve) => {
            const {
                titulo = "Confirmar ação",
                tipo = "alerta",
                textoConfirmar = "Confirmar",
                textoCancelar = "Cancelar"
            } = opcoes;
            const icones = { perigo: "🗑️", alerta: "⚠️", info: "❓", sucesso: "✓" };
            const overlay = document.createElement("div");
            overlay.className = "confirm-overlay";
            overlay.innerHTML = `
                <div class="confirm-box" role="dialog" aria-modal="true">
                    <div class="confirm-icon ${tipo}">${icones[tipo] || icones.alerta}</div>
                    <div class="confirm-titulo">${escapeHtmlUI(titulo)}</div>
                    <div class="confirm-mensagem">${escapeHtmlUI(mensagem)}</div>
                    <div class="confirm-acoes">
                        <button class="secundario" data-cancelar>${escapeHtmlUI(textoCancelar)}</button>
                        <button class="${tipo === "perigo" ? "confirmar-perigo" : tipo === "alerta" ? "confirmar-alerta" : ""}" data-confirmar>${escapeHtmlUI(textoConfirmar)}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            const fechar = (valor) => {
                overlay.style.opacity = "0";
                setTimeout(() => {
                    overlay.remove();
                    document.removeEventListener("keydown", onKey);
                    resolve(valor);
                }, 120);
            };
            const onKey = (e) => {
                if (e.key === "Escape") fechar(false);
                if (e.key === "Enter") fechar(true);
            };
            overlay.querySelector("[data-cancelar]").onclick = () => fechar(false);
            overlay.querySelector("[data-confirmar]").onclick = () => fechar(true);
            overlay.addEventListener("click", (e) => {
                if (e.target === overlay) fechar(false);
            });
            document.addEventListener("keydown", onKey);
            setTimeout(() => overlay.querySelector("[data-confirmar]").focus(), 50);
        });
    },

    modal(titulo, conteudoHtml, onConfirmar) {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        overlay.innerHTML = `
            <div class="modal">
                <h3 class="modal-title">${escapeHtmlUI(titulo)}</h3>
                <form id="modal-form" autocomplete="off">
                    ${conteudoHtml}
                    <div class="acoes-form">
                        <button type="button" class="secundario" data-fechar>Cancelar</button>
                        <button type="submit" data-submit>Confirmar</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector("[data-fechar]").onclick = () => overlay.remove();
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) overlay.remove();
        });
        const onKey = (e) => {
            if (e.key === "Escape") {
                overlay.remove();
                document.removeEventListener("keydown", onKey);
            }
        };
        document.addEventListener("keydown", onKey);
        overlay.querySelector("#modal-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const form = e.target;
            const submitBtn = form.querySelector("[data-submit]");
            const dados = Format.aplicarNoForm(form);
            const textoOriginal = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.classList.add("btn-loading");
            submitBtn.innerHTML = `<span class="spinner"></span> Processando...`;
            try {
                await onConfirmar(dados, overlay);
                document.removeEventListener("keydown", onKey);
                overlay.remove();
            } catch (err) {
                UI.toast(err.message, "erro");
                submitBtn.disabled = false;
                submitBtn.classList.remove("btn-loading");
                submitBtn.innerHTML = textoOriginal;
            }
        });
        setTimeout(() => {
            const primeiro = overlay.querySelector("input, select, textarea");
            if (primeiro) primeiro.focus();
        }, 50);
    },

    spinner(tamanho = "normal") {
        return `<span class="spinner${tamanho === "grande" ? " grande" : ""}"></span>`;
    },

    async btnLoading(botao, texto = "Carregando...", fn) {
        if (!botao) return fn();
        const original = botao.innerHTML;
        const originalDisabled = botao.disabled;
        botao.disabled = true;
        botao.classList.add("btn-loading");
        botao.innerHTML = `<span class="spinner"></span> ${texto}`;
        try {
            return await fn();
        } finally {
            botao.disabled = originalDisabled;
            botao.classList.remove("btn-loading");
            botao.innerHTML = original;
        }
    },

    skeletonTabela(linhas = 5, colunas = 6) {
        let html = "";
        for (let i = 0; i < linhas; i++) {
            html += '<tr class="skeleton-row">';
            for (let j = 0; j < colunas; j++) html += '<td><span class="skeleton linha"></span></td>';
            html += "</tr>";
        }
        return html;
    },

    overlayCarregando(texto = "Carregando...") {
        this.overlayRemover();
        const overlay = document.createElement("div");
        overlay.className = "loading-overlay";
        overlay.id = "overlay-loading";
        overlay.innerHTML = `
            <div class="loading-box">
                <span class="spinner grande"></span>
                <span>${escapeHtmlUI(texto)}</span>
            </div>
        `;
        document.body.appendChild(overlay);
        return {
            atualizar: (novoTexto) => {
                const span = overlay.querySelector(".loading-box span:last-child");
                if (span) span.textContent = novoTexto;
            },
            fechar: () => overlay.remove()
        };
    },
    overlayRemover() {
        const el = document.getElementById("overlay-loading");
        if (el) el.remove();
    },

    formatarMoeda(v) {
        return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    },
    formatarData(d) {
        return new Date(d).toLocaleString("pt-BR");
    },

    tema() {
        document.body.classList.toggle("escuro", (localStorage.getItem("tema") || "claro") === "escuro");
    },
    alternarTema() {
        const atual = localStorage.getItem("tema") === "escuro" ? "claro" : "escuro";
        localStorage.setItem("tema", atual);
        UI.tema();
    },

    async atualizarBadgeLixeira() {
        if (!Auth.logado()) return;
        if (estaNaPaginaLogin()) return;
        try {
            const { total } = await api("/produtos/lixeira/count");
            const exibir = total > 0;
            ["topbar-badge-lixeira", "tab-badge-lixeira"].forEach((id) => {
                const el = document.getElementById(id);
                if (!el) return;
                el.textContent = total;
                el.style.display = exibir ? "" : "none";
            });
        } catch {
            /* silencioso */
        }
    },

    montarTopbar(paginaAtiva) {
        const usuario = Auth.usuario() || {};
        const link = (href, label, ativo) =>
            `<a href="${href}" class="${ativo === paginaAtiva ? "ativo" : ""}">${label}</a>`;

        const links = [
            link("dashboard.html", "📊 Dashboard", "dashboard"),
            link("produtos.html", "📦 Produtos", "produtos"),
            link("categorias.html", "🏷️ Categorias", "categorias"),
            link("movimentacoes.html", "🔄 Movimentações", "movimentacoes")
        ];

        if (Auth.admin()) {
            links.push(link("relatorios.html", "📈 Relatórios", "relatorios"));
            links.push(link("admin.html", "⚙️ Admin", "admin"));
            links.push(link("logs.html", "📜 Logs", "logs"));
        }

        if (Auth.superAdmin()) {
            links.push(link("super-admin.html", "👑 Super", "super-admin"));
        }

        const papelLabel = usuario.papel === "super_admin" ? "👑 dev" : usuario.papel || "";

        return `
            <header class="topbar">
                <button class="menu-toggle" aria-label="Abrir menu" onclick="return false;">
                    ☰
                </button>
                <div class="logo">📦 Estoque</div>
                <nav>
                    ${links.join("")}
                </nav>
                <div class="usuario">
                    <span class="ocultar-mobile">
                        Olá, <strong>${usuario.nome || ""}</strong> (${papelLabel})
                    </span>
                    <button class="btn-icone" onclick="UI.alternarTema()" title="Alternar tema">🌓</button>
                    <button class="btn-icone" onclick="Auth.limpar(); location.href='index.html'" title="Sair">⏻</button>
                </div>
            </header>
        `;
    }
};

function escapeHtmlUI(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

UI.tema();

document.addEventListener(
    "blur",
    (e) => {
        if (e.target.matches?.("input[data-formato], textarea[data-formato]")) {
            Format.aplicar(e.target);
        }
    },
    true
);

if (Auth.logado() && !estaNaPaginaLogin()) {
    setTimeout(() => UI.atualizarBadgeLixeira(), 200);
}

// ===================== MENU MOBILE =====================
(function configurarMenuMobile() {
    let overlay = document.querySelector(".menu-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "menu-overlay";
        document.body.appendChild(overlay);
    }
    document.addEventListener("click", (e) => {
        const btnMenu = e.target.closest(".menu-toggle");
        const nav = document.querySelector("header.topbar nav");
        if (btnMenu) {
            e.preventDefault();
            nav?.classList.toggle("aberto");
            overlay.classList.toggle("ativo");
            return;
        }
        if (e.target === overlay) {
            nav?.classList.remove("aberto");
            overlay.classList.remove("ativo");
            return;
        }
        if (e.target.closest("header.topbar nav a")) {
            nav?.classList.remove("aberto");
            overlay.classList.remove("ativo");
        }
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            document.querySelector("header.topbar nav")?.classList.remove("aberto");
            overlay.classList.remove("ativo");
        }
    });
    window.addEventListener("resize", () => {
        if (window.innerWidth > 1024) {
            document.querySelector("header.topbar nav")?.classList.remove("aberto");
            overlay.classList.remove("ativo");
        }
    });
})();

// ===================== WEBSOCKET =====================
const Socket = {
    conn: null,
    conectar() {
        if (!Auth.logado()) return;
        if (estaNaPaginaLogin()) return;
        if (typeof io === "undefined") return;
        if (Socket.conn?.connected) return;

        Socket.conn = io({
            auth: { token: Auth.token() },
            reconnection: true,
            reconnectionDelay: 2000
        });

        Socket.conn.on("connect", () => console.log("⚡ WebSocket conectado"));
        Socket.conn.on("disconnect", () => console.log("⚡ WebSocket desconectado"));
        Socket.conn.on("connect_error", (err) => console.warn("⚡ Erro WS:", err.message));

        Socket.conn.on("produto:removido", () => UI.atualizarBadgeLixeira());
        Socket.conn.on("produto:atualizado", () => UI.atualizarBadgeLixeira());
    },
    on(evento, handler) {
        Socket.conectar();
        Socket.conn?.on(evento, handler);
    }
};
