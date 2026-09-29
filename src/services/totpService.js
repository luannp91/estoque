const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

/**
 * Serviço de autenticação em dois fatores (TOTP).
 * Compatível com Google Authenticator, Authy, 1Password, etc.
 */
class TotpService {
    /**
     * Gera um novo secret + QR code + recovery codes.
     */
    async gerarSetup(email) {
        const secret = speakeasy.generateSecret({
            name: `Estoque (${email})`,
            issuer: "Sistema de Estoque",
            length: 32
        });

        const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

        return {
            secret: secret.base32,
            qrCode: qrCodeDataURL,
            otpauthUrl: secret.otpauth_url
        };
    }

    /**
     * Verifica se um código TOTP é válido.
     * Janela de ±1 período (30s antes/depois) para tolerar clock drift.
     */
    verificar(secret, codigo) {
        if (!secret || !codigo) return false;

        return speakeasy.totp.verify({
            secret,
            encoding: "base32",
            token: String(codigo).replace(/\s/g, ""),
            window: 1
        });
    }
}

module.exports = new TotpService();
