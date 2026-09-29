const fs = require("fs");
const path = require("path");
const db = require("../config/database");
const backupCrypto = require("./backupCryptoService");

const BACKUP_DIR = path.resolve(__dirname, "..", "..", "backups");
const MAX_BACKUPS_AUTO = 20;

// ==================== HELPERS ====================
function ensureDir() {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function timestamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

function formatarTamanho(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function gerarSnapshot(destino) {
    const sqlPath = destino.replace(/\\/g, "/");
    db.exec(`VACUUM INTO '${sqlPath}'`);
}

// ==================== CRIAÇÃO ====================
function criarBackupManual() {
    ensureDir();
    const nome = `estoque-manual-${timestamp()}.db.cifrado`;
    const destino = path.join(BACKUP_DIR, nome);
    const tmp = destino + ".tmp";

    // 1) Snapshot limpo
    gerarSnapshot(tmp);

    // 2) Lê, criptografa e grava
    const plano = fs.readFileSync(tmp);
    const cifrado = backupCrypto.criptografar(plano);
    fs.writeFileSync(destino, cifrado);

    // 3) Limpa temporário
    fs.unlinkSync(tmp);

    const tamanho = fs.statSync(destino).size;
    return { nome, caminho: destino, tamanho, tamanho_legivel: formatarTamanho(tamanho) };
}

function criarBackupAutomatico() {
    ensureDir();
    const nome = `estoque-auto-${timestamp()}.db.cifrado`;
    const destino = path.join(BACKUP_DIR, nome);
    const tmp = destino + ".tmp";

    gerarSnapshot(tmp);
    const plano = fs.readFileSync(tmp);
    const cifrado = backupCrypto.criptografar(plano);
    fs.writeFileSync(destino, cifrado);
    fs.unlinkSync(tmp);

    rotacionarBackups();

    const tamanho = fs.statSync(destino).size;
    return { nome, caminho: destino, tamanho, tamanho_legivel: formatarTamanho(tamanho) };
}

// ==================== ROTAÇÃO ====================
function rotacionarBackups() {
    const auto = fs
        .readdirSync(BACKUP_DIR)
        .filter((f) => f.startsWith("estoque-auto-") && (f.endsWith(".db") || f.endsWith(".db.cifrado")))
        .map((f) => ({
            nome: f,
            mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs
        }))
        .sort((a, b) => b.mtime - a.mtime);

    const excedentes = auto.slice(MAX_BACKUPS_AUTO);
    for (const a of excedentes) {
        try {
            fs.unlinkSync(path.join(BACKUP_DIR, a.nome));
        } catch {}
    }
}

// ==================== INFO ====================
function info() {
    const dbPath = path.resolve(__dirname, "..", "..", "estoque.db");
    const stat = fs.statSync(dbPath);

    const counts = {
        usuarios: db.prepare("SELECT COUNT(*) AS t FROM usuarios").get().t,
        categorias: db.prepare("SELECT COUNT(*) AS t FROM categorias").get().t,
        produtos: db.prepare("SELECT COUNT(*) AS t FROM produtos").get().t,
        movimentacoes: db.prepare("SELECT COUNT(*) AS t FROM movimentacoes").get().t
    };

    ensureDir();
    const backups = fs
        .readdirSync(BACKUP_DIR)
        .filter((f) => f.endsWith(".db") || f.endsWith(".db.cifrado"))
        .map((f) => {
            const s = fs.statSync(path.join(BACKUP_DIR, f));
            return {
                nome: f,
                tamanho: s.size,
                tamanho_legivel: formatarTamanho(s.size),
                modificado_em: s.mtime,
                tipo: f.includes("-auto-") ? "automatico" : "manual",
                criptografado: f.endsWith(".cifrado")
            };
        })
        .sort((a, b) => new Date(b.modificado_em) - new Date(a.modificado_em));

    return {
        tamanho_bytes: stat.size,
        tamanho_legivel: formatarTamanho(stat.size),
        modificado_em: stat.mtime,
        registros: counts,
        backups
    };
}

function listar() {
    ensureDir();
    return fs
        .readdirSync(BACKUP_DIR)
        .filter((f) => f.endsWith(".db") || f.endsWith(".db.cifrado"))
        .map((f) => {
            const s = fs.statSync(path.join(BACKUP_DIR, f));
            return {
                nome: f,
                caminho: path.join(BACKUP_DIR, f),
                tamanho: s.size,
                tamanho_legivel: formatarTamanho(s.size),
                modificado_em: s.mtime,
                tipo: f.includes("-auto-") ? "automatico" : "manual",
                criptografado: f.endsWith(".cifrado")
            };
        })
        .sort((a, b) => new Date(b.modificado_em) - new Date(a.modificado_em));
}

function remover(nome) {
    const seguro = path.basename(nome);
    const caminho = path.join(BACKUP_DIR, seguro);
    if (!fs.existsSync(caminho)) {
        const e = new Error("Backup não encontrado.");
        e.status = 404;
        throw e;
    }
    fs.unlinkSync(caminho);
}

module.exports = {
    criarBackupManual,
    criarBackupAutomatico,
    info,
    listar,
    remover,
    formatarTamanho,
    BACKUP_DIR
};
