import { Repositorio } from "../persistence/repositorio.js";
import { Lote } from "../models/lote.js";
import { Organizacao } from "../models/organizacao.js";
import { Equipamento } from "../models/equipamento.js";
import { FabricaEntidades } from "../models/fabrica.js";
import { RegraDeNegocioError } from "../models/erros.js";
import { ARQ_LOTES, ARQ_ORGANIZACOES, ARQ_EQUIPAMENTOS } from "../config/caminhos.js";
import { logger } from "../utils/logger.js";
import { registrarTransacao } from "../persistence/journal.js";

const repo = new Repositorio<Lote>(ARQ_LOTES);

type Contexto = { usuario: string };

function carregarLotes(): Lote[] {
  return repo.carregar().map((item) => Lote.deJSON(item));
}

function organizacaoExiste(id: string): boolean {
  return new Repositorio<Organizacao>(ARQ_ORGANIZACOES).carregar().some((o) => o.id === id);
}

function criarLote(opcoes: Record<string, string>, ctx: Contexto): void {
  const org = opcoes["org"];
  const nf = opcoes["nf"];
  const transp = opcoes["transp"];
  const data = opcoes["data"] || new Date().toISOString().slice(0, 10);

  if (!org || !nf || !transp) {
    logger.erro("Uso: lote criar --org <ORG_ID> --nf <NOTA_FISCAL> --transp <TRANSPORTADORA> [--data AAAA-MM-DD]");
    return;
  }

  if (!organizacaoExiste(org)) {
    logger.erro(`Nenhuma organização encontrada com o ID '${org}'.`);
    return;
  }

  const lote = FabricaEntidades.criarLote(org, nf, transp, data);
  repo.salvar([...carregarLotes(), lote]);

  registrarTransacao(ctx.usuario, "registrar_lote", { id: lote.id, org });
  logger.sucesso(`Lote registrado com sucesso! ID: ${lote.id}`);
}

function listarLotes(opcoes: Record<string, string>): void {
  const org = opcoes["org"]?.trim();
  const lotes = carregarLotes().filter((l) => !org || l.organizacaoId === org);

  if (lotes.length === 0) {
    logger.info("Nenhum lote encontrado.");
    return;
  }

  console.log("\n--- Lotes ---");
  for (const l of lotes) {
    console.log(
      `ID: ${l.id} | Org: ${l.organizacaoId} | NF: ${l.notaFiscal} | Transportadora: ${l.transportadora} | Entrada: ${l.dataEntrada}`
    );
  }
}

function consultarLote(opcoes: Record<string, string>): void {
  const id = opcoes["id"]?.trim();
  if (!id) {
    logger.erro("Uso: lote consultar --id <LOTE_ID>");
    return;
  }

  const l = carregarLotes().find((item) => item.id === id);
  if (!l) {
    logger.erro(`Nenhum lote encontrado com o ID '${id}'.`);
    return;
  }

  const qtdEquipamentos = new Repositorio<Equipamento>(ARQ_EQUIPAMENTOS)
    .carregar()
    .filter((e) => e.loteId === id).length;

  console.log("\n--- Detalhes do lote ---");
  console.log(`ID: ${l.id}`);
  console.log(`Organização: ${l.organizacaoId}`);
  console.log(`Nota fiscal: ${l.notaFiscal}`);
  console.log(`Transportadora: ${l.transportadora}`);
  console.log(`Data de entrada: ${l.dataEntrada}`);
  console.log(`Equipamentos no lote: ${qtdEquipamentos}`);
  console.log(`Criado em: ${l.criadoEm}`);
}

function atualizarLote(opcoes: Record<string, string>, ctx: Contexto): void {
  const id = opcoes["id"]?.trim();
  if (!id) {
    logger.erro("Uso: lote atualizar --id <LOTE_ID> [--nf <NOTA_FISCAL>] [--transp <TRANSPORTADORA>] [--data AAAA-MM-DD]");
    return;
  }

  const nf = opcoes["nf"];
  const transp = opcoes["transp"];
  const data = opcoes["data"];
  if (!nf && !transp && !data) {
    logger.erro("Informe ao menos um campo para atualizar (--nf, --transp ou --data).");
    return;
  }

  const lista = carregarLotes();
  const indice = lista.findIndex((l) => l.id === id);
  if (indice === -1) {
    logger.erro(`Nenhum lote encontrado com o ID '${id}'.`);
    return;
  }

  const atual = lista[indice];
  const atualizado = new Lote(
    atual.id,
    atual.organizacaoId,
    nf ?? atual.notaFiscal,
    transp ?? atual.transportadora,
    data ?? atual.dataEntrada,
    atual.criadoEm
  );

  // A janela de 90 dias só vale para a data informada agora; um lote antigo
  // continua podendo ter NF/transportadora corrigidas.
  if (data) atualizado.validar();

  lista[indice] = atualizado;
  repo.salvar(lista);

  const campos = [nf && "nf", transp && "transp", data && "data"].filter(Boolean);
  registrarTransacao(ctx.usuario, "atualizar_lote", { id, campos });
  logger.sucesso(`Lote '${id}' atualizado com sucesso.`);
}

function removerLote(opcoes: Record<string, string>, ctx: Contexto): void {
  const id = opcoes["id"]?.trim();
  if (!id) {
    logger.erro("Uso: lote remover --id <LOTE_ID>");
    return;
  }

  const lista = carregarLotes();
  if (!lista.some((l) => l.id === id)) {
    logger.erro(`Nenhum lote encontrado com o ID '${id}'.`);
    return;
  }

  const temEquipamentos = new Repositorio<Equipamento>(ARQ_EQUIPAMENTOS).carregar().some((e) => e.loteId === id);
  if (temEquipamentos) {
    throw new RegraDeNegocioError("Não é possível remover um lote que possui equipamentos vinculados.");
  }

  repo.salvar(lista.filter((l) => l.id !== id));

  registrarTransacao(ctx.usuario, "remover_lote", { id });
  logger.sucesso(`Lote '${id}' removido com sucesso.`);
}

export function executarLotes(subAcao: string, opcoes: Record<string, string>, ctx: Contexto): void {
  switch (subAcao) {
    case "criar":
      criarLote(opcoes, ctx);
      break;
    case "listar":
      listarLotes(opcoes);
      break;
    case "consultar":
      consultarLote(opcoes);
      break;
    case "atualizar":
      atualizarLote(opcoes, ctx);
      break;
    case "remover":
      removerLote(opcoes, ctx);
      break;
    default:
      logger.erro("Ação inválida. Use: lote criar | listar | consultar | atualizar | remover.");
  }
}
