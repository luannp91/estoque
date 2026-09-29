const request = require("supertest");
const { app, tokenAdmin } = require("./helpers");

describe("📜 10. Logs de Segurança (Auditoria)", () => {
    let token;

    beforeAll(async () => {
        token = await tokenAdmin();
        const db = require("../../src/config/database");
        db.prepare("UPDATE usuarios SET bloqueado_ate = NULL, tentativas_falhas = 0").run();
    });

    test("Login bem-sucedido gera log SEC_LOGIN_SUCESSO", async () => {
        await request(app).post("/api/auth/login").send({ email: "admin@estoque.com", senha: "admin123" });

        const db = require("../../src/config/database");
        const log = db
            .prepare("SELECT * FROM logs_sistema WHERE acao = 'SEC_LOGIN_SUCESSO' ORDER BY id DESC LIMIT 1")
            .get();

        expect(log).toBeDefined();
        expect(log.descricao).toMatch(/login ok/i);
    });

    test("Login falho gera log SEC_LOGIN_FALHA", async () => {
        await request(app).post("/api/auth/login").send({ email: "admin@estoque.com", senha: "errada-teste" });

        const db = require("../../src/config/database");
        const log = db
            .prepare("SELECT * FROM logs_sistema WHERE acao = 'SEC_LOGIN_FALHA' ORDER BY id DESC LIMIT 1")
            .get();

        expect(log).toBeDefined();
        expect(log.nivel).toBe("warn");
    });

    test("Endpoint /api/logs filtra por ação", async () => {
        const resp = await request(app)
            .get("/api/logs?acao=SEC_LOGIN_FALHA&limite=5")
            .set("Authorization", `Bearer ${token}`);

        expect(resp.status).toBe(200);
        expect(Array.isArray(resp.body.itens)).toBe(true);
    });
});
