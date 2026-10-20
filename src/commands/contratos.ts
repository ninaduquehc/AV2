import { Repositorio } from "../persistence/repositorio";
import { Contrato } from "../models/contrato";
import { FabricaEntidades } from "../models/fabrica";
import { ARQ_CONTRATOS } from "../config/caminhos";
import { log } from "../utils/logger";
import { registrarTransacao } from "../persistence/journal";

const repo = new Repositorio<Contrato>(ARQ_CONTRATOS);

export function executarContratos(opcoes: Record<string, string>, ctx: { usuario: string }): void {
  const org = opcoes["org"];
  const inicio = opcoes["inicio"];
  const fim = opcoes["fim"];
  const termos = opcoes["termos"] || "Termos padrão de logística reversa";

  if (!org || !inicio || !fim) {
    log.erro("Uso: contrato criar --org <ORG_ID> --inicio <AAAA-MM-DD> --fim <AAAA-MM-DD> [--termos TEXTO]");
    return;
  }

  const contrato = FabricaEntidades.criarContrato(org, inicio, fim, termos);
  const lista = repo.carregar();
  lista.push(contrato);
  repo.salvar(lista.map((c) => Contrato.deJSON(c)));

  registrarTransacao(ctx.usuario, "cadastrar_contrato", { id: contrato.id, organizacaoId: org });
  log.sucesso(`Contrato cadastrado com sucesso! ID: ${contrato.id}`);
}