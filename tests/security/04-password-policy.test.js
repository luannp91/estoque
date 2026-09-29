const request = require("supertest");
const { app, tokenAdmin } = require("./helpers");

describe("🔑 4. Política de Senha Forte", () => {
    let token;

    beforeAll(async () => {
        // 🔧 Reset do admin caso alguma suíte tenha bloqueado
        const db = require("../../src/config/database");
        db.prepare("UPDATE usuarios SET bloqueado_ate = NULL, tentativas_falhas = 0").run();

        token = await tokenAdmin();
    });

    const criarUsuario = (email, senha) =>
        request(app)
            .post("/api/admin/usuarios")
            .set("Authorization", `Bearer ${token}`)
            .send({ nome: "Teste", email, senha, papel: "operador" });

    test("Senha muito curta é rejeitada", async () => {
        const resp = await criarUsuario(`t1-${Date.now()}@test.com`, "Ab1@");

        // Pode ser barrado pelo Zod ("Dados inválidos") ou pelo PasswordService ("política")
        expect(resp.status).toBe(400);
        expect(resp.body.erro).toMatch(/política|8 caracteres|dados inválidos/i);
    });

    test("Senha sem maiúscula é rejeitada", async () => {
        const resp = await criarUsuario(`t2-${Date.now()}@test.com`, "senha@forte1");
        expect(resp.status).toBe(400);
        expect(resp.body.erro).toMatch(/maiúscula/i);
    });

    test("Senha sem número é rejeitada", async () => {
        const resp = await criarUsuario(`t3-${Date.now()}@test.com`, "Senha@Forte");
        expect(resp.status).toBe(400);
        expect(resp.body.erro).toMatch(/número/i);
    });

    test("Senha sem caractere especial é rejeitada", async () => {
        const resp = await criarUsuario(`t4-${Date.now()}@test.com`, "SenhaForte123");
        expect(resp.status).toBe(400);
        expect(resp.body.erro).toMatch(/especial/i);
    });

    test("Senha comum (blacklist) é rejeitada", async () => {
        // 🔧 Agora blacklist é validada ANTES das sequências
        const resp = await criarUsuario(`t5-${Date.now()}@test.com`, "Admin@123");
        expect(resp.status).toBe(400);
        expect(resp.body.erro).toMatch(/comum|descoberta/i);
    });

    test("Senha FORTE é aceita", async () => {
        const email = `forte${Date.now()}@test.com`;
        const resp = await criarUsuario(email, "MinhaS3nh@Forte2024");
        expect(resp.status).toBe(201);
        expect(resp.body.email).toBe(email);
    });
});
