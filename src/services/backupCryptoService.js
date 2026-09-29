const crypto = require("crypto");
const env = require("../config/env");

/**
 * Criptografia AES-256-GCM para backups.
 * - Chave derivada do BACKUP_ENCRYPTION_KEY
 * - IV aleatório por arquivo (12 bytes, recomendado para GCM)
 * - Auth tag previne adulteração
 * - Formato do arquivo: [MAGIC(4)] [IV(12)] [AUTH_TAG(16)] [CIFRADO...]
 */
const MAGIC = Buffer.from("ESBK"); // "Estoque BacKup"

class BackupCryptoService {
    _getKey() {
        const key = env.backupEncryptionKey;
        if (!key || key.length !== 64) {
            throw new Error("BACKUP_ENCRYPTION_KEY inválida (precisa de 64 chars hex = 32 bytes).");
        }
        return Buffer.from(key, "hex");
    }

    /**
     * Criptografa um buffer e retorna outro buffer no formato proprietário.
     */
    criptografar(bufferPlano) {
        const key = this._getKey();
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

        const cifrado = Buffer.concat([cipher.update(bufferPlano), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return Buffer.concat([MAGIC, iv, authTag, cifrado]);
    }

    /**
     * Descriptografa um buffer. Lança erro se formato inválido ou auth falhar.
     */
    descriptografar(bufferCompleto) {
        const key = this._getKey();

        if (bufferCompleto.length < MAGIC.length + 12 + 16 + 1) {
            throw new Error("Arquivo criptografado muito curto.");
        }
        if (!bufferCompleto.slice(0, 4).equals(MAGIC)) {
            throw new Error("Arquivo não é um backup criptografado válido.");
        }

        let offset = 4;
        const iv = bufferCompleto.slice(offset, offset + 12);
        offset += 12;
        const authTag = bufferCompleto.slice(offset, offset + 16);
        offset += 16;
        const cifrado = bufferCompleto.slice(offset);

        const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(authTag);

        try {
            return Buffer.concat([decipher.update(cifrado), decipher.final()]);
        } catch {
            throw new Error("Falha ao descriptografar: chave inválida ou arquivo corrompido.");
        }
    }

    /** Detecta se um buffer já está no formato criptografado. */
    estaCriptografado(buffer) {
        return buffer.length >= 4 && buffer.slice(0, 4).equals(MAGIC);
    }
}

module.exports = new BackupCryptoService();
