const request = require("supertest");
const { app } = require("./helpers");

describe("🌐 2. CORS restritivo", () => {
    test("Origem permitida (localhost) funciona", async () => {
        const resp = await request(app).get("/api/auth/me").set("Origin", "http://localhost:3000");
        expect(resp.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    });

    test("Origem suspeita NÃO recebe header CORS", async () => {
        const resp = await request(app).get("/api/auth/me").set("Origin", "http://site-malicioso.com");
        expect(resp.headers["access-control-allow-origin"]).toBeUndefined();
    });

    test("Preflight OPTIONS retorna 200 ou 204", async () => {
        const resp = await request(app)
            .options("/api/auth/login")
            .set("Origin", "http://localhost:3000")
            .set("Access-Control-Request-Method", "POST");
        expect([200, 204]).toContain(resp.status);
    });
});
