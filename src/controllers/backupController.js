const fs = require("fs");
const path = require("path");
const multer = require("multer");
const backupService = require("../services/backupService");
const restoreService = require("../services/restoreService");
const backupCrypto = require("../services/backupCryptoService");
const LogService = require("../services/logService");

const logService = new LogService();

const TMP_DIR = path.resolve(__dirname, "..", "..", "tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// ==================== MULTER ====================
const upload = multer({
    dest: TMP_DIR,
    limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
    fileFilter: (req, file, cb) => {
        const nome = file.originalname.toLowerCase();
        if (!nome.endsWith(".db") && !nome.endsWith(".cifrado")) {
            return cb(new Error("Apenas arquivos .db ou .cifrado são permitidos."));
        }
        cb(null, true);
    }
});

exports.uploadMiddleware = upload.single("arquivo");

// ==================== INFO ====================
exports.info = (req, res, next) => {
    try {
        res.json(backupService.info());
    } catch (e) {
        next(e);
    }
};

exports.listar = (req, res, next) => {
    try {
        res.json(backupService.listar());
    } catch (e) {
        next(e);
    }
};

// ==================== DOWNLOAD (snapshot instantâneo) ====================
exports.baixar = (req, res, next) => {
    const tmpPath = path.resolve(TMP_DIR, `.snapshot-${Date.now()}.db`);
    try {
        const sqlPath = tmpPath.replace(/\\/g, "/");

        // 1) Gera snapshot limpo
        require("../config/database").exec(`VACUUM INTO '${sqlPath}'`);

        // 2) Lê e criptografa
        const plano = fs.readFileSync(tmpPath);
        const cifrado = backupCrypto.criptografar(plano);

        // 3) Prepara nome do arquivo
        const data = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
        const nomeArquivo = `estoque-backup-${data}.db.cifrado`;

        // 4) Envia
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
        res.setHeader("Content-Length", cifrado.length);
        res.send(cifrado);

        logService.registrar({
            req,
            acao: "backup_download",
            entidade: "backup",
            descricao: `Download criptografado: ${nomeArquivo}`
        });
    } catch (e) {
        next(e);
    } finally {
        try {
            if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        } catch {}
    }
};

exports.baixarPorNome = (req, res, next) => {
    const nome = path.basename(req.params.nome);
    const caminho = path.join(backupService.BACKUP_DIR, nome);

    if (!fs.existsSync(caminho)) {
        return res.status(404).json({ erro: "Backup não encontrado." });
    }

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${nome}"`);
    res.sendFile(caminho);
};

exports.remover = (req, res, next) => {
    try {
        const nome = path.basename(req.params.nome);
        backupService.remover(nome);
        logService.registrar({
            req,
            acao: "backup_remover",
            entidade: "backup",
            descricao: `Removeu backup ${nome}`,
            nivel: "warn"
        });
        res.status(204).send();
    } catch (e) {
        next(e);
    }
};

// ==================== CRIAR BACKUP MANUAL (salvo em /backups) ====================
exports.criarManual = (req, res, next) => {
    try {
        const b = backupService.criarBackupManual();
        logService.registrar({
            req,
            acao: "backup_criar",
            entidade: "backup",
            descricao: `Backup manual criptografado: ${b.nome} (${b.tamanho_legivel})`
        });
        res.status(201).json({
            ...b,
            criptografado: true,
            mensagem: "Backup criado e criptografado com AES-256-GCM."
        });
    } catch (e) {
        // Loga o erro real para debug
        console.error("❌ Erro ao criar backup manual:", e.message);
        next(e);
    }
};

// ==================== RESTAURAÇÃO (com descriptografia automática) ====================
exports.restaurar = (req, res, next) => {
    if (!req.file) return res.status(400).json({ erro: "Nenhum arquivo enviado." });

    const tmpPath = req.file.path;
    let caminhoFinal = tmpPath;
    let descriptografado = null;

    try {
        // 🔓 Detecta e descriptografa se necessário
        const buffer = fs.readFileSync(tmpPath);
        const ehCifrado = backupCrypto.estaCriptografado(buffer);

        if (ehCifrado) {
            try {
                const plano = backupCrypto.descriptografar(buffer);
                descriptografado = tmpPath + ".db";
                fs.writeFileSync(descriptografado, plano);
                caminhoFinal = descriptografado;
            } catch (err) {
                return res.status(400).json({
                    erro: "Falha ao descriptografar o arquivo. Verifique se a chave BACKUP_ENCRYPTION_KEY está correta.",
                    detalhes: err.message
                });
            }
        }

        // 🔄 Restaura
        const info = restoreService.restaurar(caminhoFinal);

        logService.registrar({
            req,
            acao: "backup_restaurar",
            entidade: "backup",
            descricao: `Restaurou banco a partir de ${req.file.originalname}${ehCifrado ? " (descriptografado)" : ""}. Backup segurança: ${info.backup_seguranca}`,
            nivel: "warn"
        });

        res.json({
            ok: true,
            mensagem: "Banco restaurado com sucesso.",
            arquivo_era_criptografado: ehCifrado,
            info
        });
    } catch (e) {
        next(e);
    } finally {
        // Limpa os arquivos temporários
        try {
            if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        } catch {}
        try {
            if (descriptografado && fs.existsSync(descriptografado)) fs.unlinkSync(descriptografado);
        } catch {}
    }
};

exports.validarUpload = (req, res, next) => {
    if (!req.file) return res.status(400).json({ erro: "Nenhum arquivo enviado." });

    const tmpPath = req.file.path;
    let caminhoFinal = tmpPath;
    let descriptografado = null;

    try {
        const buffer = fs.readFileSync(tmpPath);
        const ehCifrado = backupCrypto.estaCriptografado(buffer);

        if (ehCifrado) {
            try {
                const plano = backupCrypto.descriptografar(buffer);
                descriptografado = tmpPath + ".db";
                fs.writeFileSync(descriptografado, plano);
                caminhoFinal = descriptografado;
            } catch (err) {
                return res.status(400).json({
                    erro: "Falha ao descriptografar o arquivo.",
                    detalhes: err.message
                });
            }
        }

        const info = restoreService.validar(caminhoFinal);
        res.json({
            ok: true,
            arquivo: req.file.originalname,
            era_criptografado: ehCifrado,
            info
        });
    } catch (e) {
        next(e);
    } finally {
        try {
            if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        } catch {}
        try {
            if (descriptografado && fs.existsSync(descriptografado)) fs.unlinkSync(descriptografado);
        } catch {}
    }
};
