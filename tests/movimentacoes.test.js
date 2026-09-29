const request = require("supertest");
const { app, loginComoAdmin } = require("./helpers");

describe("Movimentações", () => {
    let token;
    let produtoId;

    beforeAll(async () => {
        token = await loginComoAdmin();

        const p = await request(app)
            .post("/api/produtos")
            .set("Authorization", `Bearer ${token}`)
            .send({ nome: "Mov Teste", sku: `MOV-${Date.now()}`, preco: 10, quantidade: 5, estoque_minimo: 0 });

        produtoId = p.body.id;

        await request(app)
            .patch(`/api/produtos/${produtoId}/entrada`)
            .set("Authorization", `Bearer ${token}`)
            .send({ quantidade: 3 });

        await request(app)
            .patch(`/api/produtos/${produtoId}/saida`)
            .set("Authorization", `Bearer ${token}`)
            .send({ quantidade: 2 });
    });

    test("GET /api/movimentacoes lista histórico", async () => {
        const resp = await request(app).get("/api/movimentacoes?limite=50").set("Authorization", `Bearer ${token}`);

        expect(resp.status).toBe(200);
        expect(resp.body.itens.length).toBeGreaterThan(0);
    });

    test("Auditoria registra entrada e saída", async () => {
        const resp = await request(app)
            .get(`/api/movimentacoes?produto_id=${produtoId}`)
            .set("Authorization", `Bearer ${token}`);

        const tipos = resp.body.itens.map((i) => i.tipo);
        expect(tipos).toContain("cadastro");
        expect(tipos).toContain("entrada");
        expect(tipos).toContain("saida");
    });
});
