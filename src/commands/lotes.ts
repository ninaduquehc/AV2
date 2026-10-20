import { Repositorio } from "../persistence/repositorio";
import { Lote } from "../models/lote";
import { FabricaEntidades } from "../models/fabrica";
import { ARQ_LOTES } from "../config/caminhos";
import { log } from "../utils/logger";
import { registrarTransacao } from "../persistence/journal";

const repo = new Repositorio<Lote>(ARQ_LOTES);

export function executarLotes(opcoes: Record<string, string>, ctx: { usuario: string }): void {
  const org = opcoes["org"];
  const nf = opcoes["nf"];
  const transp = opcoes["transp"];
  const data = opcoes["data"] || new Date().toISOString().slice(0, 10);

  if (!org || !nf || !transp) {
    log.erro("Uso: lote criar --org <ORG_ID> --nf <NOTA_FISCAL> --transp <TRANSPORTADORA> [--data AAAA-MM-DD]");
    return;
  }

  const lote = FabricaEntidades.criarLote(org, nf, transp, data);
  const lista = repo.carregar();
  const novaLista = [...lista.map((item) => Lote.deJSON(item)), lote];
  repo.salvar(novaLista);

  registrarTransacao(ctx.usuario, "registrar_lote", { id: lote.id, org });
  log.sucesso(`Lote registrado com sucesso! ID: ${lote.id}`);
}