import { lerJournal, verificarIntegridadeJournal } from "../persistence/journal";
import { log } from "../utils/logger";

export function verificarEExibirHistorico(): void {
  const invalido = verificarIntegridadeJournal();

  if (invalido === -1) {
    log.sucesso("Journal de auditoria verificado: Todos os registros estão íntegros.");
  } else {
    log.erro(`Journal adulterado a partir do registro #${invalido + 1}.`);
  }

  const registros = lerJournal();
  console.log("\n=== REGISTROS DE AUDITORIA ===");
  console.table(registros.slice(-20));
}