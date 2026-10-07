require("dotenv").config({ quiet: true });
const crypto = require("crypto");

/**
 * Valida variáveis de ambiente obrigatórias no boot.
 * Falha rápido se algo crítico está faltando/inseguro.
 */
function validar() {
    const erros = [];
    const avisos = [];

    const env = process.env.NODE_ENV || "development";
    const ehProducao = env === "production";

    // ============ JWT_SECRET ============
    if (!process.env.JWT_SECRET) {
        erros.push(
            "JWT_SECRET é obrigatório. Gere com: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
        );
    } else if (process.env.JWT_SECRET.length < 32) {
        if (ehProducao) {
            erros.push("JWT_SECRET deve ter pelo menos 32 caracteres em produção.");
        } else {
            avisos.push("⚠️ JWT_SECRET curto. Use 64+ caracteres em produção.");
        }
    } else if (process.env.JWT_SECRET === "dev-secret" || process.env.JWT_SECRET.includes("troque")) {
        if (ehProducao) {
            erros.push("JWT_SECRET está com valor padrão. Troque em produção!");
        } else {
            avisos.push("⚠️ JWT_SECRET é o padrão de desenvolvimento.");
        }
    }

    // ============ BACKUP_ENCRYPTION_KEY ============
    if (ehProducao && !process.env.BACKUP_ENCRYPTION_KEY) {
        erros.push("BACKUP_ENCRYPTION_KEY é obrigatória em produção.");
    }
    if (process.env.BACKUP_ENCRYPTION_KEY && process.env.BACKUP_ENCRYPTION_KEY.length !== 64) {
        erros.push("BACKUP_ENCRYPTION_KEY deve ter exatamente 64 caracteres hex (32 bytes).");
    }

    // ============ CORS ============
    if (ehProducao && !process.env.CORS_ORIGINS) {
        erros.push('CORS_ORIGINS é obrigatória em produção (não use "*").');
    }

    // ============ PORT ============
    const porta = Number(process.env.PORT || 3000);
    if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
        erros.push("PORT deve ser um número entre 1 e 65535.");
    }

    // ============ BCRYPT_ROUNDS ============
    const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
    if (rounds < 10 || rounds > 15) {
        erros.push("BCRYPT_ROUNDS deve estar entre 10 e 15.");
    }

    if (avisos.length) {
        console.warn("\n⚠️  Avisos de configuração:\n");
        avisos.forEach((a) => console.warn("   " + a));
        console.warn("");
    }

    if (erros.length) {
        console.error("\n❌ Erros críticos de configuração:\n");
        erros.forEach((e) => console.error("   • " + e));
        console.error("\n💡 Corrija o arquivo .env e reinicie.\n");
        process.exit(1);
    }

    console.log(`🔒 Variáveis de ambiente validadas (${env})`);
}

module.exports = {
    validar,

    // Exporta valores tipados
    get env() {
        return process.env.NODE_ENV || "development";
    },
    get isProducao() {
        return process.env.NODE_ENV === "production";
    },
    get jwtSecret() {
        return process.env.JWT_SECRET;
    },
    get jwtExpires() {
        return process.env.JWT_EXPIRES || "15m";
    },
    get jwtRefreshExpires() {
        return process.env.JWT_REFRESH_EXPIRES || "7d";
    },
    get bcryptRounds() {
        return Number(process.env.BCRYPT_ROUNDS || 12);
    },
    get corsOrigins() {
        const orig = process.env.CORS_ORIGINS || "";
        return orig
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    },
    get backupEncryptionKey() {
        return process.env.BACKUP_ENCRYPTION_KEY;
    },
    get rateLimitWindow() {
        return Number(process.env.RATE_LIMIT_WINDOW_MS || 900000);
    },
    get rateLimitMax() {
        return Number(process.env.RATE_LIMIT_MAX || 100);
    },
    get authRateLimitMax() {
        return Number(process.env.AUTH_RATE_LIMIT_MAX || 5);
    },
    get authLockoutMinutes() {
        return Number(process.env.AUTH_LOCKOUT_MINUTES || 15);
    },
    get authMaxAttempts() {
        return Number(process.env.AUTH_MAX_ATTEMPTS || 5);
    }
};
