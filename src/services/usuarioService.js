const bcrypt = require("bcryptjs");
const UsuarioRepository = require("../repositories/usuarioRepository");
const LogService = require("./logService");
const PasswordService = require("./passwordService");

const SIGLAS = new Set([
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

const PAPEIS_VALIDOS = ["admin", "operador", "super_admin"];

class UsuarioService {
    constructor() {
        this.repo = new UsuarioRepository();
        this.log = new LogService();
    }

    listar(filtros) {
        return this.repo.listar({
            busca: filtros.busca || "",
            papel: filtros.papel || "",
            ativo: filtros.ativo || "",
            pagina: Number(filtros.pagina) || 1,
            limite: Number(filtros.limite) || 10,
            ordenar: filtros.ordenar || "nome",
            ordem: filtros.ordem || "asc"
        });
    }

    buscar(id) {
        const u = this.repo.porId(id);
        if (!u) throw this._erro("Usuário não encontrado.", 404);
        return u;
    }

    criar({ nome, email, senha, papel = "operador" }, req) {
        const usuarioLogado = req.usuario;

        nome = this._titulo(nome);
        email = this._email(email);

        if (!nome || !email || !senha) throw this._erro("Nome, e-mail e senha são obrigatórios.", 400);
        if (!this._emailValido(email)) throw this._erro("E-mail inválido.", 400);
        if (!PAPEIS_VALIDOS.includes(papel)) throw this._erro("Papel inválido.", 400);

        // 🔒 Só super-admin pode criar outro super-admin
        if (papel === "super_admin" && usuarioLogado.papel !== "super_admin") {
            this.log.registrar({
                req,
                acao: "SEC_ACAO_NEGADA",
                entidade: "usuario",
                descricao: `Usuário ${usuarioLogado.id} (${usuarioLogado.papel}) tentou CRIAR super-admin`,
                nivel: "error"
            });
            throw this._erro("Apenas super-admin pode criar outro super-admin.", 403);
        }

        // 🔒 Operador não pode criar admin
        if (papel === "admin" && usuarioLogado.papel === "operador") {
            throw this._erro("Operadores não podem criar administradores.", 403);
        }

        const policy = PasswordService.validar(senha);
        if (!policy.ok) {
            throw this._erro("Senha não atende à política: " + policy.erros.join(" "), 400);
        }

        if (this.repo.porEmail(email)) throw this._erro("E-mail já cadastrado.", 409);

        const senha_hash = bcrypt.hashSync(senha, PasswordService.rounds);
        const u = this.repo.criar({ nome, email, senha_hash, papel });

        this.log.registrar({
            req,
            acao: "usuario_criar",
            entidade: "usuario",
            entidade_id: u.id,
            descricao: `Criou usuário "${u.nome}" (${u.email}) como ${u.papel}`
        });
        return u;
    }

    atualizar(id, dados, req) {
        const usuarioLogado = req.usuario;
        const atual = this.buscar(id);

        const nome = this._titulo(dados.nome);
        const email = this._email(dados.email);
        const { papel, ativo } = dados;

        if (!nome || !email) throw this._erro("Nome e e-mail são obrigatórios.", 400);
        if (!this._emailValido(email)) throw this._erro("E-mail inválido.", 400);
        if (!PAPEIS_VALIDOS.includes(papel)) throw this._erro("Papel inválido.", 400);

        // 🚫 NUNCA um admin mexe em super_admin
        if (atual.papel === "super_admin" && usuarioLogado.papel !== "super_admin") {
            this.log.registrar({
                req,
                acao: "SEC_ACAO_NEGADA",
                entidade: "usuario",
                entidade_id: id,
                descricao: `ADMIN ${usuarioLogado.id} tentou EDITAR super-admin ${id}`,
                nivel: "error"
            });
            throw this._erro("Apenas super-admin pode editar outro super-admin.", 403);
        }

        // 🚫 Ninguém (nem super-admin) pode rebaixar o último super-admin ativo
        if (atual.papel === "super_admin" && atual.ativo) {
            const vaiDeixarDeSerSuper = papel !== "super_admin" || ativo === false;
            if (vaiDeixarDeSerSuper) {
                const total = this.repo.contarPorPapel("super_admin");
                if (total <= 1) {
                    throw this._erro("Não é possível rebaixar/desativar o último super-admin.", 400);
                }
            }
        }

        // 🚫 Admin NUNCA pode promover alguém a super_admin
        if (papel === "super_admin" && usuarioLogado.papel !== "super_admin") {
            this.log.registrar({
                req,
                acao: "SEC_ACAO_NEGADA",
                entidade: "usuario",
                entidade_id: id,
                descricao: `ADMIN ${usuarioLogado.id} tentou PROMOVER ${id} a super-admin`,
                nivel: "error"
            });
            throw this._erro("Apenas super-admin pode promover para super-admin.", 403);
        }

        // 🚫 Operador não pode promover para admin
        if (papel === "admin" && usuarioLogado.papel === "operador") {
            throw this._erro("Operadores não podem promover para administrador.", 403);
        }

        if (email !== atual.email) {
            const outro = this.repo.porEmail(email);
            if (outro && outro.id !== id) throw this._erro("E-mail já está em uso.", 409);
        }

        const ehSelf = usuarioLogado.id === id;
        if (ehSelf && ativo === false) {
            throw this._erro("Você não pode desativar sua própria conta.", 400);
        }
        if (ehSelf && atual.papel === "admin" && papel === "operador") {
            throw this._erro("Você não pode rebaixar seu próprio papel.", 400);
        }

        const estaPerdendoAdmin = atual.papel === "admin" && atual.ativo && (papel === "operador" || ativo === false);
        if (estaPerdendoAdmin && this.repo.contarAdminsAtivos() <= 1) {
            throw this._erro("Não é possível remover o último administrador ativo.", 400);
        }

        const atualizado = this.repo.atualizar(id, { nome, email, papel, ativo });

        this.log.registrar({
            req,
            acao: "usuario_atualizar",
            entidade: "usuario",
            entidade_id: id,
            descricao: `Atualizou usuário "${atualizado.nome}" → papel=${papel}, ativo=${ativo ? "sim" : "não"}`
        });
        return atualizado;
    }

    remover(id, req) {
        const alvo = this.buscar(id);
        const usuarioLogado = req.usuario;

        if (usuarioLogado.id === id) {
            throw this._erro("Você não pode remover sua própria conta.", 400);
        }

        // 🚫 Admin NUNCA pode remover super-admin
        if (alvo.papel === "super_admin" && usuarioLogado.papel !== "super_admin") {
            this.log.registrar({
                req,
                acao: "SEC_ACAO_NEGADA",
                entidade: "usuario",
                entidade_id: id,
                descricao: `ADMIN ${usuarioLogado.id} (${usuarioLogado.nome}) tentou EXCLUIR super-admin ${id} (${alvo.nome})`,
                nivel: "error"
            });
            throw this._erro("Apenas super-admin pode remover outro super-admin.", 403);
        }

        // 🚫 Ninguém pode remover o último super-admin ativo
        if (alvo.papel === "super_admin" && alvo.ativo) {
            const total = this.repo.contarPorPapel("super_admin");
            if (total <= 1) {
                throw this._erro("Não é possível remover o último super-admin ativo.", 400);
            }
        }

        // 🚫 Não pode remover o último admin ativo
        if (alvo.papel === "admin" && alvo.ativo && this.repo.contarAdminsAtivos() <= 1) {
            throw this._erro("Não é possível remover o último administrador ativo.", 400);
        }

        this.repo.remover(id);

        this.log.registrar({
            req,
            acao: "usuario_remover",
            entidade: "usuario",
            entidade_id: id,
            descricao: `Removeu usuário "${alvo.nome}" (${alvo.email}) — papel=${alvo.papel}`,
            nivel: "warn"
        });
        return true;
    }

    resetarSenha(id, novaSenha, req) {
        const alvo = this.buscar(id);

        // 🚫 Admin NUNCA pode resetar senha de super-admin
        if (alvo.papel === "super_admin" && req.usuario.papel !== "super_admin") {
            this.log.registrar({
                req,
                acao: "SEC_ACAO_NEGADA",
                entidade: "usuario",
                entidade_id: id,
                descricao: `ADMIN ${req.usuario.id} tentou RESETAR SENHA do super-admin ${id}`,
                nivel: "error"
            });
            throw this._erro("Apenas super-admin pode resetar senha de outro super-admin.", 403);
        }

        const policy = PasswordService.validar(novaSenha);
        if (!policy.ok) {
            throw this._erro("Senha não atende à política: " + policy.erros.join(" "), 400);
        }

        const senha_hash = bcrypt.hashSync(novaSenha, PasswordService.rounds);
        this.repo.alterarSenha(id, senha_hash);

        this.log.registrar({
            req,
            acao: "usuario_resetar_senha",
            entidade: "usuario",
            entidade_id: id,
            descricao: `Redefiniu senha do usuário "${alvo.nome}"`,
            nivel: "warn"
        });
        return true;
    }

    estatisticas() {
        return this.repo.estatisticas();
    }

    // ==================== NORMALIZAÇÃO ====================
    _protegerSiglas(texto) {
        const siglas = [];
        const protegido = String(texto).replace(/\p{L}+/gu, (palavra) => {
            const upper = palavra.toUpperCase();
            if (SIGLAS.has(upper)) {
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
    }

    _restaurarSiglas(texto, siglas) {
        return String(texto).replace(/\u0001(\d+)\u0001/g, (m, i) => siglas[Number(i)]);
    }

    _titulo(texto) {
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
    }

    _email(texto) {
        if (!texto) return "";
        return String(texto).trim().toLowerCase();
    }

    _emailValido(email) {
        return /^\S+@\S+\.\S+$/.test(email);
    }
    _erro(msg, status) {
        const e = new Error(msg);
        e.status = status;
        return e;
    }
}

module.exports = UsuarioService;
