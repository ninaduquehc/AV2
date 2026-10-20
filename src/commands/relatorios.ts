import { lerJournal } from "../persistence/journal";
import { Repositorio } from "../persistence/repositorio";
import { Equipamento } from "../models/equipamento";
import { Movimentacao } from "../models/movimentacao";
import { ARQ_EQUIPAMENTOS, ARQ_MOVIMENTACOES } from "../config/caminhos";
import { log } from "../utils/logger";

export function executarRelatorios(subAcao: string, opcoes: Record<string, string>): void {
  if (subAcao === "journal") {
    const registros = lerJournal();
    console.log("\n=== REGISTRO DE AUDITORIA (JOURNAL - MÍN. 180 DIAS) ===");
    console.table(registros.slice(-20));
  } else if (subAcao === "rastrear") {
    const id = opcoes["id"];
    if (!id) {
      log.erro("Uso: relatorio rastrear --id <COD_BARRAS>");
      return;
    }

    const repoEq = new Repositorio<Equipamento>(ARQ_EQUIPAMENTOS);
    const repoMov = new Repositorio<Movimentacao>(ARQ_MOVIMENTACOES);

    const eq = repoEq.carregar().map((e) => Equipamento.deJSON(e)).find((e) => e.id === id);
    if (!eq) {
      log.erro("Equipamento não encontrado.");
      return;
    }

    const movs = repoMov.carregar().map((m) => Movimentacao.deJSON(m)).filter((m) => m.equipamentoId === id);

    console.log(`\n=== RASTREABILIDADE DO EQUIPAMENTO ${id} ===`);
    console.log(`Lote: ${eq.loteId} | Tipo: ${eq.tipo} | Modelo: ${eq.modelo}`);
    console.log(`Status Atual: ${eq.status} | Estado Físico: ${eq.estadoFisico}`);
    console.log(`Triagem Concluída: ${eq.triagemConcluida ? "Sim" : "Não"}`);
    console.log("Histórico de Movimentações:");
    console.table(movs);
  }
}