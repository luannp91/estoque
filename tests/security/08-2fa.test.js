const request = require("supertest");
const { app, loginComoAdmin, resetar2FA } = require("./helpers");
const TotpService = require("../../src/services/totpService");

describe("🔐 8. Autenticação em 2 Fatores (TOTP)", () => {
    let tokenAdmin;
    let secretAtual;

    beforeAll(async () => {
        // Garante que admin começa SEM 2FA ativo (evita falha em runs repetidos)
        resetar2FA("admin@estoque.com");

        tokenAdmin = await loginComoAdmin();
    });

    afterAll(() => {
        // Limpa 2FA ao final para não afetar outras suítes
        resetar2FA("admin@estoque.com");
    });

    test("Iniciar setup 2FA retorna QR code + secret", async () => {
        const resp = await request(app).post("/api/auth/2fa/iniciar").set("Authorization", `Bearer ${tokenAdmin}`);

        expect(resp.status).toBe(200);
        expect(resp.body.secret).toBeDefined();
        expect(resp.body.qrCode).toMatch(/^data:image\/png;base64,/);
        expect(resp.body.otpauthUrl).toContain("otpauth://totp/");

        secretAtual = resp.body.secret;
    });

    test("Confirmar 2FA com código inválido → 401", async () => {
        const resp = await request(app)
            .post("/api/auth/2fa/confirmar")
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({ codigo: "000000" });

        expect(resp.status).toBe(401);
    });

    test("Confirmar 2FA com código válido ativa", async () => {
        // Gera um código válido usando nosso próprio service
        const codigo = TotpService.gerarCodigo(secretAtual);

        const resp = await request(app)
            .post("/api/auth/2fa/confirmar")
            .set("Authorization", `Bearer ${tokenAdmin}`)
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
        const codigo = TotpService.gerarCodigo(secretAtual);

        const resp = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin@estoque.com", senha: "admin123", codigo2fa: codigo });

        expect(resp.status).toBe(200);
        expect(resp.body.token).toBeTruthy();
    });

    test("Login com código errado falha", async () => {
        const resp = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin@estoque.com", senha: "admin123", codigo2fa: "000000" });

        expect(resp.status).toBe(401);
    });

    test("Desativar 2FA com senha correta", async () => {
        const resp = await request(app)
            .post("/api/auth/2fa/desativar")
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({ senha: "admin123" });

        expect(resp.status).toBe(200);
    });
});
