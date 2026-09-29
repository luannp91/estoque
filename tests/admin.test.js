const request = require("supertest");
const { app, loginComoAdmin } = require("./helpers");

describe("Painel Admin", () => {
    let tokenAdmin;

    beforeAll(async () => {
        tokenAdmin = await loginComoAdmin();
    });

    test("GET /api/admin/estatisticas", async () => {
        const resp = await request(app).get("/api/admin/estatisticas").set("Authorization", `Bearer ${tokenAdmin}`);

        expect(resp.status).toBe(200);
        expect(resp.body).toHaveProperty("total_usuarios");
    });

    test("GET /api/admin/usuarios lista", async () => {
        const resp = await request(app).get("/api/admin/usuarios").set("Authorization", `Bearer ${tokenAdmin}`);

        expect(resp.status).toBe(200);
        expect(Array.isArray(resp.body.itens)).toBe(true);
    });

    test("POST /api/admin/usuarios cria", async () => {
        const resp = await request(app)
            .post("/api/admin/usuarios")
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({
                nome: "Novo User",
                email: `novo${Date.now()}@test.com`,
                senha: "MinhaS3nh@Forte2024", // 🔐 senha forte
                papel: "operador"
            });

        expect(resp.status).toBe(201);
    });

    test("Admin não pode se auto-remover", async () => {
        const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${tokenAdmin}`);

        const resp = await request(app)
            .delete(`/api/admin/usuarios/${me.body.id}`)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(resp.status).toBe(400);
    });

    test("Operador não acessa /api/admin", async () => {
        const email = `op${Date.now()}@test.com`;
        const senha = "MinhaS3nh@Forte2024"; // 🔐 senha forte

        await request(app).post("/api/auth/registrar").send({ nome: "Op", email, senha });

        const login = await request(app).post("/api/auth/login").send({ email, senha });

        const resp = await request(app).get("/api/admin/usuarios").set("Authorization", `Bearer ${login.body.token}`);

        expect(resp.status).toBe(403);
    });
});
