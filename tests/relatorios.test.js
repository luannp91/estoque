const request = require("supertest");
const { app, loginComoAdmin } = require("./helpers");

describe("Relatórios", () => {
    let token;
    beforeAll(async () => {
        token = await loginComoAdmin();
    });

    test("GET dashboard", async () => {
        const resp = await request(app).get("/api/relatorios/dashboard").set("Authorization", `Bearer ${token}`);

        expect(resp.status).toBe(200);
        expect(resp.body).toHaveProperty("resumo");
        expect(resp.body).toHaveProperty("estoqueBaixo");
    });

    test("GET exportar-excel retorna xlsx", async () => {
        const resp = await request(app)
            .get("/api/relatorios/exportar-excel")
            .set("Authorization", `Bearer ${token}`)
            .buffer(true)
            .parse((res, cb) => {
                const chunks = [];
                res.on("data", (c) => chunks.push(c));
                res.on("end", () => cb(null, Buffer.concat(chunks)));
            });

        expect(resp.status).toBe(200);
        expect(resp.headers["content-type"]).toMatch(/spreadsheetml/);
        expect(resp.headers["content-disposition"]).toMatch(/\.xlsx/);
    });

    test("GET /api/logs/estatisticas só admin", async () => {
        const resp = await request(app).get("/api/logs/estatisticas").set("Authorization", `Bearer ${token}`);

        expect(resp.status).toBe(200);
        expect(resp.body).toHaveProperty("total");
    });
});
