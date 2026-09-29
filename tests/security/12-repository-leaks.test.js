const request = require("supertest");
const { app, tokenAdmin } = require("./helpers");

describe("🔍 12. Vazamento de dados sensíveis", () => {
    let token;

    beforeAll(async () => {
        token = await tokenAdmin();
    });

    test("API de usuários NUNCA retorna senha_hash", async () => {
        const resp = await request(app).get("/api/admin/usuarios").set("Authorization", `Bearer ${token}`);

        const json = JSON.stringify(resp.body);
        expect(json).not.toMatch(/senha_hash/);
        expect(json).not.toMatch(/\$2[aby]\$/);
    });

    test("API /auth/me não retorna senha_hash", async () => {
        const resp = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

        expect(resp.body.senha_hash).toBeUndefined();
    });

    test("Login NÃO retorna hash nem totp_secret", async () => {
        const resp = await request(app).post("/api/auth/login").send({ email: "admin@estoque.com", senha: "admin123" });

        expect(resp.body.usuario?.senha_hash).toBeUndefined();
        expect(resp.body.usuario?.totp_secret).toBeUndefined();
    });
});
