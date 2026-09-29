const request = require("supertest");
const jwt = require("jsonwebtoken");
const { app, loginAdmin } = require("./helpers");

describe("⏱️ 7. JWT - Assinatura e claims", () => {
    let login;

    beforeAll(async () => {
        login = await loginAdmin();
    });

    test("Token é JWT válido com 3 partes", () => {
        expect(login.token).toBeDefined();
        expect(login.token.split(".")).toHaveLength(3);
    });

    test("Token contém claims corretos", () => {
        const payload = jwt.decode(login.token);
        expect(payload.id).toBeDefined();
        expect(payload.email).toBe("admin@estoque.com");
        expect(payload.papel).toBe("admin");
        expect(payload.iss).toBe("estoque-app");
    });

    test("Token adulterado é rejeitado", async () => {
        const adulterado = login.token.slice(0, -5) + "XXXXX";
        const resp = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${adulterado}`);
        expect(resp.status).toBe(401);
    });

    test("Token assinado com chave errada é rejeitado", async () => {
        const falso = jwt.sign({ id: 1, papel: "admin" }, "outra-chave-qualquer", {
            expiresIn: "1h",
            issuer: "estoque-app"
        });
        const resp = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${falso}`);
        expect(resp.status).toBe(401);
    });

    test("Token sem Bearer é rejeitado", async () => {
        const resp = await request(app).get("/api/auth/me").set("Authorization", login.token);
        expect(resp.status).toBe(401);
    });

    test("Token de refresh NÃO é aceito como access token", async () => {
        const resp = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.refreshToken}`);
        expect(resp.status).toBe(401);
    });

    test("Refresh token gera novo access token", async () => {
        const resp = await request(app).post("/api/auth/refresh").send({ refreshToken: login.refreshToken });
        expect(resp.status).toBe(200);
        expect(resp.body.token).toBeDefined();
    });
});
