const fs = require("fs");
const backupCrypto = require("../../src/services/backupCryptoService");

describe("💾 9. Criptografia de Backups (AES-256-GCM)", () => {
    test("Criptografar e descriptografar retorna o original", () => {
        const original = Buffer.from("conteúdo secreto do banco de dados");
        const cifrado = backupCrypto.criptografar(original);
        const decifrado = backupCrypto.descriptografar(cifrado);

        expect(decifrado.equals(original)).toBe(true);
    });

    test('Arquivo cifrado tem magic bytes "ESBK"', () => {
        const cifrado = backupCrypto.criptografar(Buffer.from("teste"));
        expect(cifrado.slice(0, 4).toString()).toBe("ESBK");
    });

    test("Cifrado é diferente do original", () => {
        const original = Buffer.from("dados do banco");
        const cifrado = backupCrypto.criptografar(original);
        expect(cifrado.equals(original)).toBe(false);
        expect(cifrado.includes(original)).toBe(false);
    });

    test("Duas criptografias do mesmo conteúdo são diferentes (IV aleatório)", () => {
        const dados = Buffer.from("mesmo conteúdo");
        const c1 = backupCrypto.criptografar(dados);
        const c2 = backupCrypto.criptografar(dados);
        expect(c1.equals(c2)).toBe(false);
    });

    test("Cifrado adulterado falha na descriptografia (auth tag)", () => {
        const original = Buffer.from("dados originais");
        const cifrado = backupCrypto.criptografar(original);
        cifrado[cifrado.length - 5] ^= 0xff;
        expect(() => backupCrypto.descriptografar(cifrado)).toThrow();
    });

    test("Arquivo sem magic bytes é rejeitado", () => {
        const falso = Buffer.from("não é um backup criptografado");
        expect(() => backupCrypto.descriptografar(falso)).toThrow();
    });

    test("detectar formato cifrado", () => {
        const cifrado = backupCrypto.criptografar(Buffer.from("x"));
        const plano = Buffer.from("SQLite format 3\0");
        expect(backupCrypto.estaCriptografado(cifrado)).toBe(true);
        expect(backupCrypto.estaCriptografado(plano)).toBe(false);
    });

    test("Backup gerado no servidor tem extensão .cifrado", () => {
        const backupService = require("../../src/services/backupService");
        const info = backupService.criarBackupManual();

        expect(info.nome).toMatch(/\.db\.cifrado$/);

        const buffer = fs.readFileSync(info.caminho);
        expect(buffer.slice(0, 4).toString()).toBe("ESBK");

        fs.unlinkSync(info.caminho);
    });
});
