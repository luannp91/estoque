const request = require("supertest");
const { app } = require("./helpers");

describe("🛡️ 11. Error Handler seguro", () => {
    test("Endpoint inexistente não vaza stack", async () => {
        const resp = await request(app).get("/api/rota-que-nao-existe");
        expect(resp.status).toBe(404);
        expect(JSON.stringify(resp.body)).not.toMatch(/at\s+.*\.js:\d+/);
    });

    test("Token inválido retorna 401 sem stack", async () => {
        const resp = await request(app).get("/api/produtos").set("Authorization", "Bearer invalido");
        expect(resp.status).toBe(401);
        expect(resp.body.stack).toBeUndefined();
    });
});
