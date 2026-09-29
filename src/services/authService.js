const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UsuarioRepository = require("../repositories/usuarioRepository");
const LogService = require("./logService");
const SecurityLogService = require("./securityLogService");
const PasswordService = require("./passwordService");
const TotpService = require("./totpService");
const env = require("../config/env");

// 📋 Siglas que SEMPRE ficam em MAIÚSCULO
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

class AuthService {
    constructor() {
        this.repo = new UsuarioRepository();
        this.log = new LogService();
        this.secLog = new SecurityLogService();
    }

    registrar({ nome, email, senha, papel = "operador" }, req = null) {
        nome = this._titulo(nome);
        email = this._email(email);

        if (!nome || !email || !senha) throw this._erro("Nome, e-mail e senha são obrigatórios.", 400);
        if (!this._emailValido(email)) throw this._erro("E-mail inválido.", 400);

        // 🔐 Valida política de senha
        const policy = PasswordService.validar(senha);
        if (!policy.ok) {
            throw this._erro("Senha não atende à política: " + policy.erros.join(" "), 400);
        }

        if (this.repo.porEmail(email)) throw this._erro("E-mail já cadastrado.", 409);
        if (!["admin", "operador"].includes(papel)) papel = "operador";

        const senha_hash = bcrypt.hashSync(senha, PasswordService.rounds);
        const usuario = this.repo.criar({ nome, email, senha_hash, papel });

        this.log.registrar({
            req,
            acao: "registrar",
            entidade: "auth",
            entidade_id: usuario.id,
            descricao: `Novo usuário cadastrado: ${usuario.email} (${papel})`
        });

        return { usuario, token: this._gerarToken(usuario) };
    }

    login({ email, senha, codigo2fa }, req = null) {
        email = this._email(email);

        const u = this.repo.porEmail(email);

        // ⚠️ Mensagem genérica para não revelar se e-mail existe
        if (!u) {
            this.secLog.loginFalha(req, email, "usuario_inexistente");
            throw this._erro("E-mail ou senha inválidos.", 401);
        }

        // 🔒 Verifica conta ativa
        if (u.ativo === 0) {
            this.secLog.loginFalha(req, email, "conta_inativa");
            throw this._erro("Conta desativada. Contate um administrador.", 403);
        }

        // 🔒 Verifica lockout
        if (u.bloqueado_ate && new Date(u.bloqueado_ate) > new Date()) {
            const minutosRestantes = Math.ceil((new Date(u.bloqueado_ate) - new Date()) / 60000);
            this.secLog.loginFalha(req, email, "conta_bloqueada");
            throw this._erro(`Conta temporariamente bloqueada. Tente novamente em ${minutosRestantes} min.`, 429);
        }

        // 🔐 Verifica senha
        if (!bcrypt.compareSync(senha, u.senha_hash)) {
            this.repo.incrementarTentativasFalhas(u.id);
            const tentativas = u.tentativas_falhas + 1;

            if (tentativas >= env.authMaxAttempts) {
                this.repo.bloquearPorMinutos(u.id, env.authLockoutMinutes);
                this.secLog.contaBloqueada(req, email);
                throw this._erro(`Muitas tentativas. Conta bloqueada por ${env.authLockoutMinutes} minutos.`, 429);
            }

            this.secLog.loginFalha(req, email, "senha_incorreta");
            const restantes = env.authMaxAttempts - tentativas;
            throw this._erro(`E-mail ou senha inválidos. ${restantes} tentativa(s) restante(s).`, 401);
        }

        // 🔐 Verifica 2FA
        if (u.totp_ativo === 1) {
            if (!codigo2fa) {
                // Não retorna sucesso — pede o código
                return { requer2FA: true, mensagem: "Informe o código do autenticador." };
            }

            if (!TotpService.verificar(u.totp_secret, codigo2fa)) {
                this.secLog.doisFatoresFalha(req, u.id);
                throw this._erro("Código 2FA inválido.", 401);
            }
        }

        // ✅ Login OK — zera tentativas, registra IP, atualiza último login
        const ip = req?.ip || req?.connection?.remoteAddress || null;
        this.repo.registrarLogin(u.id, ip);
        this.secLog.loginSucesso(req, u);

        const publico = { id: u.id, nome: u.nome, email: u.email, papel: u.papel };
        return {
            usuario: publico,
            token: this._gerarToken(publico),
            refreshToken: this._gerarRefreshToken(publico)
        };
    }

    refresh(refreshToken, req = null) {
        try {
            const payload = jwt.verify(refreshToken, env.jwtSecret);
            const u = this.repo.porId(payload.id);
            if (!u || u.ativo === 0) throw new Error("Usuário inválido");

            const publico = { id: u.id, nome: u.nome, email: u.email, papel: u.papel };
            return { token: this._gerarToken(publico) };
        } catch {
            throw this._erro("Refresh token inválido.", 401);
        }
    }

    logout(req) {
        this.log.registrar({ req, acao: "logout", entidade: "auth", descricao: "Logout" });
    }

    /**
     * Troca de senha do próprio usuário (exige senha atual).
     */
    trocarSenha(usuario_id, senhaAtual, novaSenha, req) {
        const u = this.repo.porIdCompleto(usuario_id);
        if (!u) throw this._erro("Usuário não encontrado.", 404);

        if (!bcrypt.compareSync(senhaAtual, u.senha_hash)) {
            this.secLog.loginFalha(req, u.email, "senha_atual_incorreta");
            throw this._erro("Senha atual incorreta.", 401);
        }

        const policy = PasswordService.validar(novaSenha);
        if (!policy.ok) throw this._erro("Nova senha: " + policy.erros.join(" "), 400);

        if (senhaAtual === novaSenha) {
            throw this._erro("A nova senha deve ser diferente da atual.", 400);
        }

        const hash = bcrypt.hashSync(novaSenha, PasswordService.rounds);
        this.repo.alterarSenha(usuario_id, hash);
        this.secLog.senhaAlterada(req, usuario_id);
        return true;
    }

    // ==================== 2FA ====================
    async iniciar2FA(usuario_id, req) {
        const u = this.repo.porId(usuario_id);
        if (!u) throw this._erro("Usuário não encontrado.", 404);

        const setup = await TotpService.gerarSetup(u.email);
        // Armazena o secret mas mantém INATIVO até confirmar com código
        this.repo.atualizar2FA(usuario_id, setup.secret, false);

        return {
            secret: setup.secret,
            qrCode: setup.qrCode,
            otpauthUrl: setup.otpauthUrl
        };
    }

    confirmar2FA(usuario_id, codigo, req) {
        const u = this.repo.porIdCompleto(usuario_id);
        if (!u || !u.totp_secret) throw this._erro("Setup 2FA não iniciado.", 400);

        if (!TotpService.verificar(u.totp_secret, codigo)) {
            this.secLog.doisFatoresFalha(req, usuario_id);
            throw this._erro("Código inválido. Tente novamente.", 401);
        }

        this.repo.atualizar2FA(usuario_id, u.totp_secret, true);
        this.secLog.doisFatoresAtivado(req, usuario_id);
        return true;
    }

    desativar2FA(usuario_id, senha, req) {
        const u = this.repo.porIdCompleto(usuario_id);
        if (!u) throw this._erro("Usuário não encontrado.", 404);
        if (!bcrypt.compareSync(senha, u.senha_hash)) {
            throw this._erro("Senha incorreta.", 401);
        }

        this.repo.atualizar2FA(usuario_id, null, false);
        this.secLog.doisFatoresDesativado(req, usuario_id);
        return true;
    }

    // ==================== Internos ====================
    _gerarToken(usuario) {
        return jwt.sign(
            { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel },
            env.jwtSecret,
            { expiresIn: env.jwtExpires, issuer: "estoque-app" }
        );
    }

    _gerarRefreshToken(usuario) {
        return jwt.sign({ id: usuario.id, tipo: "refresh" }, env.jwtSecret, {
            expiresIn: env.jwtRefreshExpires,
            issuer: "estoque-app"
        });
    }

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

module.exports = AuthService;
