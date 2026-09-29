const request = require("supertest");
const { app } = require("./helpers");

describe("🚦 3. Rate Limiting", () => {
    test("Headers de rate limit estão presentes", async () => {
        const resp = await request(app).get("/api/auth/me");
        expect(resp.headers["ratelimit-limit"] || resp.headers["x-ratelimit-limit"]).toBeDefined();
    });
});
