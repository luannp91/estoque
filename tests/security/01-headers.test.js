const request = require("supertest");
const { app } = require("./helpers");

describe("🔒 1. Headers de Segurança (Helmet)", () => {
    let resp;

    beforeAll(async () => {
        resp = await request(app).get("/health");
    });

    test("Content-Security-Policy está presente", () => {
        expect(resp.headers["content-security-policy"]).toBeDefined();
        expect(resp.headers["content-security-policy"]).toContain("default-src 'self'");
    });

    test("X-Content-Type-Options = nosniff", () => {
        expect(resp.headers["x-content-type-options"]).toBe("nosniff");
    });

    test("X-Frame-Options = DENY", () => {
        expect(resp.headers["x-frame-options"]).toBe("DENY");
    });

    test("Referrer-Policy = no-referrer", () => {
        expect(resp.headers["referrer-policy"]).toBe("no-referrer");
    });

    test("X-Powered-By NÃO é enviado", () => {
        expect(resp.headers["x-powered-by"]).toBeUndefined();
    });

    test("X-DNS-Prefetch-Control = off", () => {
        expect(resp.headers["x-dns-prefetch-control"]).toBe("off");
    });

    test("CSP permite onclick (script-src-attr unsafe-inline)", () => {
        const csp = resp.headers["content-security-policy"] || "";
        expect(csp).toContain("script-src-attr 'unsafe-inline'");
    });
});
