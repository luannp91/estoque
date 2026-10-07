/**
 * Helpers compartilhados pelos testes de segurança.
 * Está em tests/security/, então sobe 2 níveis para chegar à raiz.
 */
const request = require("supertest");
const app = require("../../src/server-test");

/**
 * Login genérico que retorna SÓ o token (string).
 */
async function login(email, senha) {
    const resp = await request(app).post("/api/auth/login").send({ email, senha });
    if (resp.status !== 200 || !resp.body.token) {
        throw new Error(`Login falhou para ${email}: ${resp.status} — ${JSON.stringify(resp.body)}`);
    }
    return resp.body.token;
}

/**
 * Login genérico que retorna o OBJETO completo do backend:
 *   { usuario, token, refreshToken }
 */
async function loginDetalhado(email, senha) {
    const resp = await request(app).post("/api/auth/login").send({ email, senha });
    if (resp.status !== 200 || !resp.body.token) {
        throw new Error(`Login falhou para ${email}: ${resp.status} — ${JSON.stringify(resp.body)}`);
    }
    return resp.body;
}

/**
 * Login como admin (retorna só o token string).
 */
async function loginComoAdmin() {
    return login("admin@estoque.com", "admin123");
}

/**
 * Login como super-admin (retorna só o token string).
 */
async function loginComoSuper() {
    return login("dev@estoque.com", "dev12345");
}

/**
 * Cria um operador aleatório e retorna o token.
 */
async function loginComoOperador() {
    const email = `op${Date.now()}${Math.floor(Math.random() * 1000)}@test.com`;
    const senha = "MinhaS3nh@Forte2024";

    await request(app).post("/api/auth/registrar").send({ nome: "Operador Teste", email, senha });

    return login(email, senha);
}

/**
 * Desativa 2FA de um usuário direto no banco.
 */
function resetar2FA(email = "admin@estoque.com") {
    try {
        const db = require("../../src/config/database");
        db.prepare("UPDATE usuarios SET totp_ativo = 0, totp_secret = NULL WHERE email = ?").run(email);
    } catch (err) {
        console.warn("[helpers] Falha ao resetar 2FA:", err.message);
    }
}

// ==================== ALIASES (compatibilidade com testes antigos) ====================

/**
 * `loginAdmin()` retorna o OBJETO COMPLETO do login de admin:
 *   { usuario, token, refreshToken }
 *
 * Diferente de `loginComoAdmin()` (string), porque alguns testes precisam
 * do refreshToken e do usuário.
 */
async function loginAdmin() {
    return loginDetalhado("admin@estoque.com", "admin123");
}

async function loginSuper() {
    return loginDetalhado("dev@estoque.com", "dev12345");
}

// `tokenAdmin()` retorna só a string (para testes que só precisam do header)
const tokenAdmin = loginComoAdmin;
const tokenSuper = loginComoSuper;
const tokenOperador = loginComoOperador;

module.exports = {
    // principais
    app,
    login,
    loginDetalhado,
    loginComoAdmin,
    loginComoSuper,
    loginComoOperador,
    resetar2FA,

    // aliases
    loginAdmin, // → OBJETO { token, refreshToken, usuario }
    loginSuper, // → OBJETO
    tokenAdmin, // → STRING (só o token)
    tokenSuper, // → STRING
    tokenOperador // → STRING
};
