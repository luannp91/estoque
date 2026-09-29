const request = require("supertest");
const { app, tokenAdmin } = require("./helpers");

describe("📋 5. Validação de Entrada (Zod)", () => {
    let token;

    beforeAll(async () => {
        token = await tokenAdmin();
    });

    test("Nome vazio + preço negativo → 400 com detalhes", async () => {
        const resp = await request(app)
            .post("/api/produtos")
            .set("Authorization", `Bearer ${token}`)
            .send({ nome: "", preco: -1, quantidade: -5, estoque_minimo: 0 });

        expect(resp.status).toBe(400);
        expect(resp.body.erro).toBe("Dados inválidos.");
        expect(Array.isArray(resp.body.detalhes)).toBe(true);
        expect(resp.body.detalhes.length).toBeGreaterThan(0);
    });

    test("ID não numérico na URL → 400", async () => {
        const resp = await request(app).get("/api/produtos/abc").set("Authorization", `Bearer ${token}`);
        expect(resp.status).toBe(400);
    });

    test("Tipo de dado incorreto no body → 400", async () => {
        const resp = await request(app)
            .post("/api/produtos")
            .set("Authorization", `Bearer ${token}`)
            .send({ nome: "Teste", preco: "abc", quantidade: 1, estoque_minimo: 0 });
        expect(resp.status).toBe(400);
    });

    test("Login com e-mail inválido → 400", async () => {
        const resp = await request(app).post("/api/auth/login").send({ email: "nao-e-email", senha: "senha123" });
        expect(resp.status).toBe(400);
    });
});
