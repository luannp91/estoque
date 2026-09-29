const request = require("supertest");
const { app, loginComoAdmin } = require("./helpers");

describe("Categorias", () => {
    let token;
    let catId;

    beforeAll(async () => {
        token = await loginComoAdmin();
    });

    test("POST cria categoria", async () => {
        const resp = await request(app)
            .post("/api/categorias")
            .set("Authorization", `Bearer ${token}`)
            .send({ nome: `Cat-${Date.now()}`, descricao: "Teste" });

        expect(resp.status).toBe(201);
        catId = resp.body.id;
    });

    test("GET lista categorias", async () => {
        const resp = await request(app).get("/api/categorias").set("Authorization", `Bearer ${token}`);

        expect(resp.status).toBe(200);
        expect(Array.isArray(resp.body)).toBe(true);
    });

    test("PUT atualiza categoria", async () => {
        const resp = await request(app)
            .put(`/api/categorias/${catId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ nome: "Atualizada", descricao: "Nova" });

        expect(resp.status).toBe(200);
        expect(resp.body.nome).toBe("Atualizada");
    });

    test("DELETE remove categoria", async () => {
        const resp = await request(app).delete(`/api/categorias/${catId}`).set("Authorization", `Bearer ${token}`);

        expect(resp.status).toBe(204);
    });
});
