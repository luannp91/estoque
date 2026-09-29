const request = require("supertest");
const { app } = require("./helpers");

describe("Autenticação", () => {
    const emailNovo = `user${Date.now()}@test.com`;

    test("POST /api/auth/registrar cria usuário", async () => {
        const resp = await request(app)
            .post("/api/auth/registrar")
            // 🔐 Senha forte (atende à política)
            .send({ nome: "Fulano", email: emailNovo, senha: "MinhaSenh@Forte2024" });

        expect(resp.status).toBe(201);
        expect(resp.body.token).toBeTruthy();
        expect(resp.body.usuario.email).toBe(emailNovo);
        expect(resp.body.usuario).not.toHaveProperty("senha_hash");
    });

    test("POST /api/auth/registrar rejeita senha fraca", async () => {
        const resp = await request(app)
            .post("/api/auth/registrar")
            .send({ nome: "Fraco", email: `fraco${Date.now()}@test.com`, senha: "senha123" });

        expect(resp.status).toBe(400);
        expect(resp.body.erro).toMatch(/política|maiúscula|especial/i);
    });

    test("POST /api/auth/login retorna token", async () => {
        const resp = await request(app).post("/api/auth/login").send({ email: "admin@estoque.com", senha: "admin123" });

        expect(resp.status).toBe(200);
        expect(resp.body.usuario.papel).toBe("admin");
    });

    test("POST /api/auth/login rejeita senha errada", async () => {
        const resp = await request(app).post("/api/auth/login").send({ email: "admin@estoque.com", senha: "errada" });

        expect(resp.status).toBe(401);
    });

    test("GET /api/auth/me retorna usuário logado", async () => {
        const login = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin@estoque.com", senha: "admin123" });

        const resp = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);

        expect(resp.status).toBe(200);
        expect(resp.body.papel).toBe("admin");
    });

    test("GET /api/auth/me sem token retorna 401", async () => {
        expect((await request(app).get("/api/auth/me")).status).toBe(401);
    });
});
