/**
 * TotpService — Geração e validação de códigos TOTP (2FA)
 *
 * Implementação própria usando `crypto` do Node.
 * Zero dependências externas para o algoritmo.
 * Compatível com Google Authenticator, Authy, 1Password.
 *
 * Referências:
 *   - RFC 4226 (HOTP)
 *   - RFC 6238 (TOTP)
 */
const crypto = require("crypto");
const QRCode = require("qrcode");

// ==================== CONFIGURAÇÃO ====================
const ISSUER = "Sistema de Estoque";
const DIGITS = 6; // 6 dígitos
const STEP = 30; // 30 segundos por janela
const ALGORITHM = "sha1";
const WINDOW = 1; // tolerância ±1 janela (evita falhas por clock drift)

// ==================== BASE32 ====================
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer) {
    let bits = 0;
    let value = 0;
    let output = "";
    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;
        while (bits >= 5) {
            output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        output += BASE32_CHARS[(value << (5 - bits)) & 31];
    }
    return output;
}

function base32Decode(input) {
    const clean = String(input).replace(/=+$/g, "").toUpperCase().replace(/\s+/g, "");

    let bits = 0;
    let value = 0;
    const output = [];

    for (let i = 0; i < clean.length; i++) {
        const idx = BASE32_CHARS.indexOf(clean[i]);
        if (idx === -1) continue; // ignora chars inválidos
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) {
            output.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    return Buffer.from(output);
}

// ==================== HOTP (RFC 4226) ====================
function hotp(secretBuffer, counter, digits = DIGITS) {
    const counterBuf = Buffer.alloc(8);
    counterBuf.writeBigUInt64BE(BigInt(counter));

    const hmac = crypto.createHmac(ALGORITHM, secretBuffer).update(counterBuf).digest();

    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

    const code = binary % 10 ** digits;
    return code.toString().padStart(digits, "0");
}

// ==================== TOTP (RFC 6238) ====================
function totp(secretBuffer, timestamp = Date.now(), step = STEP, digits = DIGITS) {
    const counter = Math.floor(timestamp / 1000 / step);
    return hotp(secretBuffer, counter, digits);
}

// ==================== TIMING-SAFE COMPARE ====================
function timingSafeEqual(a, b) {
    if (typeof a !== "string" || typeof b !== "string") return false;
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ==================== SERVIÇO ====================
class TotpService {
    /**
     * Gera um novo setup 2FA para o usuário.
     * @param {string} email
     * @returns {Promise<{ secret, qrCode, otpauthUrl }>}
     */
    async gerarSetup(email) {
        // 20 bytes = 160 bits (recomendação da RFC 4226)
        const secretBuffer = crypto.randomBytes(20);
        const secret = base32Encode(secretBuffer);

        const otpauthUrl =
            `otpauth://totp/${encodeURIComponent(ISSUER)}:${encodeURIComponent(email)}` +
            `?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}` +
            `&algorithm=SHA1&digits=${DIGITS}&period=${STEP}`;

        const qrCode = await QRCode.toDataURL(otpauthUrl);

        return { secret, qrCode, otpauthUrl };
    }

    /**
     * Verifica se o código TOTP é válido para o secret informado.
     * Aceita ±1 janela (30s) para tolerar relógios dessincronizados.
     */
    verificar(secret, codigo) {
        if (!secret || !codigo) return false;

        try {
            const token = String(codigo).replace(/\s+/g, "");
            if (!/^\d{4,8}$/.test(token)) return false;

            const secretBuffer = base32Decode(secret);
            if (secretBuffer.length === 0) return false;

            const now = Date.now();

            for (let i = -WINDOW; i <= WINDOW; i++) {
                const esperado = totp(secretBuffer, now + i * STEP * 1000);
                if (timingSafeEqual(token, esperado)) return true;
            }

            return false;
        } catch (err) {
            console.error("[TotpService] Erro ao verificar TOTP:", err.message);
            return false;
        }
    }

    /**
     * Gera o código TOTP atual para um secret (usado em testes).
     */
    gerarCodigo(secret) {
        const secretBuffer = base32Decode(secret);
        return totp(secretBuffer);
    }
}

module.exports = new TotpService();
