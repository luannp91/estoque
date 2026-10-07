/**
 * BackupJob — Backup automático a cada 12 horas (00:00 e 12:00)
 *
 * Usa `croner` (zero dependências) no lugar de `node-cron`.
 * Mantém a interface: `backupJob.iniciar()`.
 */
const { Cron } = require("croner");

const backupService = require("../services/backupService");
const logService = require("../services/logService");

class BackupJob {
    constructor() {
        this.job = null;
    }

    /**
     * Inicia o agendamento do backup automático.
     * Executa a cada 12 horas: 00:00 e 12:00.
     */
    iniciar() {
        // Evita duplicação em hot reload do nodemon
        if (this.job) {
            this.job.stop();
        }

        // Cron: minuto 0, a cada 12 horas → 00:00 e 12:00
        this.job = new Cron("0 0,12 * * *", { name: "backup-automatico" }, async () => {
            await this.executar();
        });

        const proxima = this.job.nextRun();
        console.log(`⏰ Backup automático agendado (próximo: ${proxima ? proxima.toLocaleString("pt-BR") : "—"})`);
    }

    /**
     * Executa um ciclo de backup.
     * Separado do agendamento para permitir teste manual.
     */
    async executar() {
        const inicio = Date.now();
        console.log(`💾 [backup] Iniciando backup automático — ${new Date().toLocaleString("pt-BR")}`);

        try {
            // ✅ Método correto do BackupService
            const resultado = await backupService.criarBackupAutomatico();

            const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
            console.log(
                `✅ [backup] Concluído em ${duracao}s — arquivo: ${resultado?.arquivo || resultado?.nome || "—"}`
            );

            try {
                logService.registrar({
                    acao: "backup_automatico",
                    entidade: "sistema",
                    descricao: `Backup automático concluído em ${duracao}s`,
                    nivel: "info"
                });
            } catch {
                /* logService pode falhar silenciosamente */
            }

            return resultado;
        } catch (err) {
            const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
            console.error(`❌ [backup] Falhou após ${duracao}s:`, err.message);

            try {
                logService.registrar({
                    acao: "backup_automatico_falha",
                    entidade: "sistema",
                    descricao: `Falha no backup automático: ${err.message}`,
                    nivel: "error"
                });
            } catch {
                /* silencioso */
            }

            // Não relança — evita derrubar o processo
            return null;
        }
    }

    /**
     * Para o agendamento (útil em testes e shutdown graceful).
     */
    parar() {
        if (this.job) {
            this.job.stop();
            this.job = null;
            console.log("⏹️  [backup] Agendamento parado");
        }
    }
}

module.exports = new BackupJob();
