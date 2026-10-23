import { lerJournal, verificarIntegridadeJournal } from "../persistence/journal.js";
import { logger } from "../utils/logger.js";

export function verificarEExibirHistorico(): void {
  const invalido = verificarIntegridadeJournal();

  if (invalido === -1) {
    logger.sucesso("Journal de auditoria verificado: Todos os registros estão íntegros.");
  } else {
    logger.erro(`Journal adulterado a partir do registro #${invalido + 1}.`);
  }

  const registros = lerJournal();
  console.log("\n=== REGISTROS DE AUDITORIA ===");
  console.table(registros.slice(-20));
}