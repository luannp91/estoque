const request = require("supertest");
const app = require("../../src/server-test");

async function loginAdmin() {
    const resp = await request(app).post("/api/auth/login").send({ email: "admin@estoque.com", senha: "admin123" });
    return resp.body;
}

async function tokenAdmin() {
    const { token } = await loginAdmin();
    return token;
}

module.exports = { app, loginAdmin, tokenAdmin };
