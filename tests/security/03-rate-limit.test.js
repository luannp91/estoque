const request = require("supertest");
const { app } = require("./helpers");

describe("🚦 3. Rate Limiting", () => {
    test("Headers de rate limit estão presentes em rotas protegidas", async () => {
        // 🔑 Usa /api/produtos, que NÃO está no skip do rate limit
        const resp = await request(app).get("/api/produtos");
        expect(resp.headers["ratelimit-limit"] || resp.headers["x-ratelimit-limit"]).toBeDefined();
    });

    test("Rotas de telemetria NÃO contam no rate limit global", async () => {
        // /auth/me está no skip → não conta no rate limit
        const resp = await request(app).get("/api/auth/me");
        // Deve responder (não 429), independente do estado do rate limit
        expect(resp.status).not.toBe(429);
    });
});
