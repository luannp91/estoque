const request = require("supertest");
const { app } = require("./helpers");

describe("🚫 6. Account Lockout (brute force)", () => {
    const email = "admin@estoque.com";
    let oldMax;
    let oldLockout;

    const resetarAdmin = () => {
        const db = require("../../src/config/database");
        db.prepare("UPDATE usuarios SET bloqueado_ate = NULL, tentativas_falhas = 0 WHERE email = ?").run(email);
    };

    beforeAll(() => {
        oldMax = process.env.AUTH_MAX_ATTEMPTS;
        oldLockout = process.env.AUTH_LOCKOUT_MINUTES;

        // 🔧 Configura o teste: 3 tentativas, 1 minuto de bloqueio
        process.env.AUTH_MAX_ATTEMPTS = "3";
        process.env.AUTH_LOCKOUT_MINUTES = "1";

        resetarAdmin();
    });

    beforeEach(() => {
        resetarAdmin();
        // Reconfirma env (outra suíte pode ter mexido)
        process.env.AUTH_MAX_ATTEMPTS = "3";
        process.env.AUTH_LOCKOUT_MINUTES = "1";
    });

    afterAll(() => {
        process.env.AUTH_MAX_ATTEMPTS = oldMax;
        process.env.AUTH_LOCKOUT_MINUTES = oldLockout;
        resetarAdmin();
    });

    test("Conta bloqueia na 3ª tentativa falha (AUTH_MAX_ATTEMPTS=3)", async () => {
        // Tentativa 1: 401 (contador = 1)
        const r1 = await request(app).post("/api/auth/login").send({ email, senha: "senha-errada-1" });
        expect(r1.status).toBe(401);
        expect(r1.body.erro).toMatch(/2 tentativa/i);

        // Tentativa 2: 401 (contador = 2)
        const r2 = await request(app).post("/api/auth/login").send({ email, senha: "senha-errada-2" });
        expect(r2.status).toBe(401);
        expect(r2.body.erro).toMatch(/1 tentativa/i);

        // Tentativa 3: BLOQUEIA (contador = 3 = máximo) → 429
        const r3 = await request(app).post("/api/auth/login").send({ email, senha: "senha-errada-3" });
        expect(r3.status).toBe(429);
        expect(r3.body.erro).toMatch(/bloqueada|bloqueado/i);
    });

    test("Conta bloqueada não loga nem com senha correta", async () => {
        // Estado já bloqueado do teste anterior? Reforça.
        const db = require("../../src/config/database");
        db.prepare(
            "UPDATE usuarios SET bloqueado_ate = datetime('now', '+5 minutes'), tentativas_falhas = 3 WHERE email = ?"
        ).run(email);

        const resp = await request(app).post("/api/auth/login").send({ email, senha: "admin123" });

        expect(resp.status).toBe(429);
        expect(resp.body.erro).toMatch(/bloqueada|bloqueado|tente novamente/i);
    });

    test("Após o reset, login volta a funcionar", async () => {
        // Reset forçado (simula "esperar o bloqueio passar")
        resetarAdmin();

        const resp = await request(app).post("/api/auth/login").send({ email, senha: "admin123" });

        expect(resp.status).toBe(200);
        expect(resp.body.token).toBeDefined();
    });
});
