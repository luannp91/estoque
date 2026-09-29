const env = require("../config/env");

/**
 * Política de senha forte.
 * Ordem importa: blacklist antes de sequências numéricas
 * para dar a mensagem mais específica.
 */
const SENHAS_PROIBIDAS = new Set([
    "12345678",
    "123456789",
    "1234567890",
    "senha123",
    "password",
    "password1",
    "admin123",
    "admin1234",
    "qwerty123",
    "abc12345",
    "1q2w3e4r",
    "iloveyou",
    "welcome1",
    "monkey123",
    "dragon123",
    "letmein123",
    "administrador",
    "estoque123",
    "empresa123",
    "usuario123",
    "brasil123",
    "futebol123",
    "admin@123",
    "admin@1234",
    "admin@admin"
]);

class PasswordService {
    validar(senha) {
        const erros = [];

        if (!senha || typeof senha !== "string") {
            return { ok: false, erros: ["Senha é obrigatória."] };
        }

        // 1) Tamanho
        if (senha.length < 8) {
            erros.push("Deve ter ao menos 8 caracteres.");
        }
        if (senha.length > 72) {
            erros.push("Não pode ter mais de 72 caracteres.");
        }

        // 2) 🔥 Blacklist ANTES das sequências (evita mensagem genérica)
        if (SENHAS_PROIBIDAS.has(senha.toLowerCase())) {
            erros.push("Esta senha é muito comum e facilmente descoberta.");
        }

        // 3) Complexidade
        if (!/[a-z]/.test(senha)) erros.push("Deve conter ao menos uma letra minúscula.");
        if (!/[A-Z]/.test(senha)) erros.push("Deve conter ao menos uma letra maiúscula.");
        if (!/[0-9]/.test(senha)) erros.push("Deve conter ao menos um número.");
        if (!/[^A-Za-z0-9]/.test(senha)) erros.push("Deve conter ao menos um caractere especial.");

        // 4) Padrões fracos
        if (/^(.)\1{5,}$/.test(senha)) {
            erros.push("Não pode ser caracteres repetidos.");
        }
        if (/(012|123|234|345|456|567|678|789|890)/.test(senha)) {
            erros.push("Não pode conter sequências numéricas óbvias.");
        }
        if (
            /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(
                senha
            )
        ) {
            erros.push("Não pode conter sequências alfabéticas óbvias.");
        }

        return { ok: erros.length === 0, erros };
    }

    forca(senha) {
        if (!senha) return 0;
        let score = 0;
        if (senha.length >= 8) score++;
        if (senha.length >= 12) score++;
        if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) score++;
        if (/[0-9]/.test(senha)) score++;
        if (/[^A-Za-z0-9]/.test(senha)) score++;
        return Math.min(score, 4);
    }

    get rounds() {
        return env.bcryptRounds;
    }
}

module.exports = new PasswordService();
