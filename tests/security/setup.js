const fs = require("fs");
const path = require("path");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-com-64-caracteres-para-validar-o-env-helper-1234567890";
process.env.JWT_EXPIRES = "1h";
process.env.JWT_REFRESH_EXPIRES = "2h";
process.env.BACKUP_ENCRYPTION_KEY = "a".repeat(64);
process.env.BCRYPT_ROUNDS = "10";

// Ajustes específicos para testes de segurança
process.env.AUTH_MAX_ATTEMPTS = "3";
process.env.AUTH_LOCKOUT_MINUTES = "1";
process.env.AUTH_RATE_LIMIT_MAX = "100";
process.env.RATE_LIMIT_MAX = "1000";

const TEST_DB = path.resolve(__dirname, "..", "..", "estoque-security-test.db");
process.env.DB_PATH = TEST_DB;

for (const suffix of ["", "-wal", "-shm"]) {
    const f = TEST_DB + suffix;
    if (fs.existsSync(f)) fs.unlinkSync(f);
}

jest.setTimeout(30000);

afterAll(() => {
    try {
        const db = require("../../src/config/database");
        if (db && typeof db.close === "function") db.close();
    } catch {
        /* silencioso */
    }

    for (const suffix of ["", "-wal", "-shm"]) {
        const f = TEST_DB + suffix;
        try {
            if (fs.existsSync(f)) fs.unlinkSync(f);
        } catch {}
    }
});
