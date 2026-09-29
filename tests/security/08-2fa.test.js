const request = require("supertest");
const speakeasy = require("speakeasy");
const { app, tokenAdmin } = require("./helpers");

describe("🔐 8. Autenticação em 2 Fatores (TOTP)", () => {
    let token;
    let secret;

    beforeAll(async () => {
        token = await tokenAdmin();
        const db = require("../../src/config/database");
        db.prepare("UPDATE usuarios SET totp_secret = NULL, totp_ativo = 0").run();
    });

    test("Iniciar setup 2FA retorna QR code + secret", async () => {
        const resp = await request(app).post("/api/auth/2fa/iniciar").set("Authorization", `Bearer ${token}`);

        expect(resp.status).toBe(200);
        expect(resp.body.secret).toBeDefined();
        expect(resp.body.qrCode).toMatch(/^data:image\/png;base64,/);
        expect(resp.body.otpauthUrl).toContain("otpauth://totp/");
        secret = resp.body.secret;
    });

    test("Confirmar 2FA com código inválido → 401", async () => {
        const resp = await request(app)
            .post("/api/auth/2fa/confirmar")
            .set("Authorization", `Bearer ${token}`)
            .send({ codigo: "000000" });

        expect(resp.status).toBe(401);
    });

    test("Confirmar 2FA com código válido ativa", async () => {
        const codigo = speakeasy.totp({ secret, encoding: "base32" });

        const resp = await request(app)
            .post("/api/auth/2fa/confirmar")
            .set("Authorization", `Bearer ${token}`)
            .send({ codigo });

        expect(resp.status).toBe(200);
        expect(resp.body.ok).toBe(true);
    });

    test("Login SEM código agora retorna requer2FA", async () => {
        const resp = await request(app).post("/api/auth/login").send({ email: "admin@estoque.com", senha: "admin123" });

        expect(resp.status).toBe(200);
        expect(resp.body.requer2FA).toBe(true);
    });

    test("Login com código correto funciona", async () => {
        // 🔧 Aguarda próximo código TOTP (o anterior pode ter expirado)
        const codigo = speakeasy.totp({ secret, encoding: "base32" });

        const resp = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin@estoque.com", senha: "admin123", codigo2fa: codigo });

        expect(resp.status).toBe(200);
        expect(resp.body.token).toBeDefined();
    });

    test("Login com código errado falha", async () => {
        const resp = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin@estoque.com", senha: "admin123", codigo2fa: "000000" });

        expect(resp.status).toBe(401);
    });

    test("Desativar 2FA com senha correta", async () => {
        const codigo = speakeasy.totp({ secret, encoding: "base32" });
        const login = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin@estoque.com", senha: "admin123", codigo2fa: codigo });

        expect(login.status).toBe(200);
        expect(login.body.token).toBeDefined();

        const resp = await request(app)
            .post("/api/auth/2fa/desativar")
            .set("Authorization", `Bearer ${login.body.token}`)
            .send({ senha: "admin123" });

        expect(resp.status).toBe(200);
    });
});
