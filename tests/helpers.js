const request = require("supertest");
const app = require("../src/server-test");

async function loginComoAdmin() {
    const resp = await request(app).post("/api/auth/login").send({ email: "admin@estoque.com", senha: "admin123" });
    return resp.body.token;
}

module.exports = { app, loginComoAdmin };
