const cron = require("node-cron");
const backupService = require("../services/backupService");

/**
 * Agenda backups automáticos a cada 12 horas (00:00 e 12:00).
 * Sintaxe do cron: 'minuto hora dia-mês mês dia-semana'
 */
function iniciar() {
    cron.schedule("0 0,12 * * *", () => {
        try {
            const b = backupService.criarBackupAutomatico();
            console.log(`💾 Backup automático: ${b.nome} (${b.tamanho_legivel})`);
        } catch (e) {
            console.error("❌ Falha no backup automático:", e.message);
        }
    });

    console.log("⏰ Agendador de backups: a cada 12h (00:00 e 12:00)");
}

module.exports = { iniciar };
