const request = require("supertest");
const { app, loginComoAdmin } = require("./helpers");

describe("Produtos", () => {
    let token;
    let produtoId;

    beforeAll(async () => {
        token = await loginComoAdmin();
    });

    test("GET /api/produtos lista com paginação", async () => {
        const resp = await request(app).get("/api/produtos?pagina=1&limite=5").set("Authorization", `Bearer ${token}`);

        expect(resp.status).toBe(200);
        expect(resp.body.itens.length).toBeLessThanOrEqual(5);
    });

    test("POST /api/produtos cria produto", async () => {
        const resp = await request(app)
            .post("/api/produtos")
            .set("Authorization", `Bearer ${token}`)
            .send({
                nome: "Produto Teste",
                sku: `SKU-${Date.now()}`,
                preco: 99.9,
                quantidade: 10,
                estoque_minimo: 2
            });

        expect(resp.status).toBe(201);
        produtoId = resp.body.id;
    });

    test("POST rejeita nome vazio", async () => {
        const resp = await request(app)
            .post("/api/produtos")
            .set("Authorization", `Bearer ${token}`)
            .send({ nome: "", preco: 10, quantidade: 1, estoque_minimo: 0 });

        expect(resp.status).toBe(400);
    });

    test("PATCH entrada aumenta quantidade", async () => {
        const resp = await request(app)
            .patch(`/api/produtos/${produtoId}/entrada`)
            .set("Authorization", `Bearer ${token}`)
            .send({ quantidade: 5 });

        expect(resp.status).toBe(200);
        expect(resp.body.quantidade).toBe(15);
    });

    test("PATCH saida rejeita estoque insuficiente", async () => {
        const resp = await request(app)
            .patch(`/api/produtos/${produtoId}/saida`)
            .set("Authorization", `Bearer ${token}`)
            .send({ quantidade: 99999 });

        expect(resp.status).toBe(400);
    });

    test("DELETE remove produto", async () => {
        const resp = await request(app).delete(`/api/produtos/${produtoId}`).set("Authorization", `Bearer ${token}`);

        expect(resp.status).toBe(204);
    });
});
