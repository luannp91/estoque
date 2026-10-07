const fs = require("fs");
const path = require("path");

// ==================== AMBIENTE DE TESTE ====================
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "a".repeat(128); // 128 chars
process.env.JWT_EXPIRES = "1h";
process.env.JWT_REFRESH_EXPIRES = "2h";
process.env.BACKUP_ENCRYPTION_KEY = "b".repeat(64); // 64 chars hex
process.env.BCRYPT_ROUNDS = "10";
process.env.AUTH_MAX_ATTEMPTS = "100";
process.env.AUTH_RATE_LIMIT_MAX = "1000";
process.env.RATE_LIMIT_MAX = "10000";
process.env.DOTENV_CONFIG_QUIET = "true"; // 🔇 silencia logs do dotenv

// ==================== BANCO DE TESTE ====================
const TEST_DB = path.resolve(__dirname, "..", "estoque-test.db");
process.env.DB_PATH = TEST_DB;

/**
 * Remove arquivo do banco de teste tolerando EBUSY no Windows.
 * Se o arquivo estiver em uso, simplesmente ignora — o DB é recriado no próximo teste.
 */
function limparArquivo(f) {
    if (!fs.existsSync(f)) return;
    try {
        fs.unlinkSync(f);
    } catch (err) {
        // EBUSY (arquivo em uso) / EPERM (permissão) → ignora silenciosamente
        // ENOENT (não existe mais) → também ignora
        if (err.code !== "EBUSY" && err.code !== "ENOENT" && err.code !== "EPERM") {
            console.warn(`[setup] Aviso ao limpar ${path.basename(f)}:`, err.code);
        }
    }
}

// Limpa antes dos testes começarem
for (const suffix of ["", "-wal", "-shm"]) {
    limparArquivo(TEST_DB + suffix);
}

jest.setTimeout(30000);

// ==================== CLEANUP FINAL ====================
afterAll(() => {
    // Tenta fechar o DB (best-effort)
    try {
        const db = require("../src/config/database");
        if (db && typeof db.close === "function") {
            db.close();
        }
    } catch {
        /* silencioso */
    }

    // Tenta limpar arquivos (tolerando EBUSY)
    for (const suffix of ["", "-wal", "-shm"]) {
        limparArquivo(TEST_DB + suffix);
    }
});
