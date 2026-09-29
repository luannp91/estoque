const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const slowDown = require("express-slow-down");
const env = require("../config/env");

// ==================== HELMET (Headers de segurança) ====================
function helmetMiddleware() {
    return helmet({
        // 🎯 Content Security Policy — previne XSS
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],

                // Scripts externos e inline (<script> e <script src>)
                scriptSrc: [
                    "'self'",
                    "https://cdn.jsdelivr.net", // Chart.js
                    "'unsafe-inline'" // handlers globais + vars
                ],

                // 🎯 ATRIBUTOS inline (onclick="...")
                // Por padrão o Helmet BLOQUEIA com 'none'.
                // Como o HTML é controlado (sem input do usuário interpolado
                // em handlers), liberamos 'unsafe-inline' apenas aqui.
                scriptSrcAttr: ["'unsafe-inline'"],

                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc: ["'self'", "ws:", "wss:"],
                fontSrc: ["'self'", "data:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
                frameAncestors: ["'none'"], // anti-clickjacking
                upgradeInsecureRequests: env.isProducao ? [] : null
            }
        },

        // HSTS — ativo apenas em produção
        hsts: env.isProducao ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,

        noSniff: true,
        frameguard: { action: "deny" },
        referrerPolicy: { policy: "no-referrer" },
        dnsPrefetchControl: { allow: false },
        hidePoweredBy: true,
        ieNoOpen: true,
        noCache: false,
        permittedCrossDomainPolicies: { permittedPolicies: "none" }
    });
}

// ==================== CORS ====================
function corsMiddleware() {
    const origensPermitidas = env.corsOrigins;

    return cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);

            if (!env.isProducao && origensPermitidas.length === 0) {
                return callback(null, true);
            }

            if (origensPermitidas.includes(origin)) {
                return callback(null, true);
            }

            callback(new Error(`CORS: origem ${origin} não permitida`));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
        maxAge: 86400
    });
}

// ==================== RATE LIMITING ====================

/** Helper: gera chave padronizada a partir do IP (normaliza IPv6) */
function ipSeguro(req) {
    // `ipKeyGenerator` trata IPv6 (agrupa por /64) evitando bypass
    return ipKeyGenerator(req.ip);
}

/** Limitador global (todas as rotas /api) */
function limiterGlobal() {
    return rateLimit({
        windowMs: env.rateLimitWindow,
        max: env.rateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
        message: { erro: "Muitas requisições. Tente novamente em alguns minutos." },
        skip: (req) => req.path.startsWith("/public") || req.path === "/health",
        keyGenerator: (req) => ipSeguro(req)
    });
}

/** Limitador agressivo para login/registro (previne brute force) */
function limiterAuth() {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        max: env.authRateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
        message: { erro: "Muitas tentativas de login. Tente novamente em 15 minutos." },
        keyGenerator: (req) => {
            const ip = ipSeguro(req);
            const email = req.body?.email ? String(req.body.email).toLowerCase() : "";
            return `${ip}:${email}`;
        },
        skipSuccessfulRequests: true
    });
}

/** Slow down: após N reqs na janela, adiciona delay progressivo */
function slowDownAuth() {
    return slowDown({
        windowMs: 15 * 60 * 1000,
        delayAfter: 3,
        delayMs: (hits) => (hits - 3) * 500,
        maxDelayMs: 5000,
        keyGenerator: (req) => ipSeguro(req)
    });
}

/** Limitador para operações pesadas (ex: gerar Excel, backup) */
function limiterPesado() {
    return rateLimit({
        windowMs: 60 * 1000,
        max: 5,
        message: { erro: "Operação muito frequente. Aguarde antes de tentar novamente." },
        keyGenerator: (req) => ipSeguro(req)
    });
}

/** Limitador de criação de recursos (previne spam) */
function limiterEscrita() {
    return rateLimit({
        windowMs: 60 * 1000,
        max: 30,
        message: { erro: "Muitas escritas. Aguarde um momento." },
        keyGenerator: (req) => ipSeguro(req)
    });
}

module.exports = {
    helmetMiddleware,
    corsMiddleware,
    limiterGlobal,
    limiterAuth,
    slowDownAuth,
    limiterPesado,
    limiterEscrita
};
