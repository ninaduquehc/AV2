import { Repositorio } from "../persistence/repositorio.js";
import { Contrato } from "../models/contrato.js";
import { Organizacao } from "../models/organizacao.js";
import { FabricaEntidades } from "../models/fabrica.js";
import { ARQ_CONTRATOS, ARQ_ORGANIZACOES } from "../config/caminhos.js";
import { logger } from "../utils/logger.js";
import { registrarTransacao } from "../persistence/journal.js";

const repo = new Repositorio<Contrato>(ARQ_CONTRATOS);

type Contexto = { usuario: string };

function carregarContratos(): Contrato[] {
  return repo.carregar().map((item) => Contrato.deJSON(item));
}

function organizacaoExiste(id: string): boolean {
  return new Repositorio<Organizacao>(ARQ_ORGANIZACOES).carregar().some((o) => o.id === id);
}

function criarContrato(opcoes: Record<string, string>, ctx: Contexto): void {
  const org = opcoes["org"];
  const inicio = opcoes["inicio"];
  const fim = opcoes["fim"];
  const termos = opcoes["termos"] || "Termos padrão de logística reversa";

  if (!org || !inicio || !fim) {
    logger.erro("Uso: contrato criar --org <ORG_ID> --inicio <AAAA-MM-DD> --fim <AAAA-MM-DD> [--termos TEXTO]");
    return;
  }

  if (!organizacaoExiste(org)) {
    logger.erro(`Nenhuma organização encontrada com o ID '${org}'.`);
    return;
  }

  const contrato = FabricaEntidades.criarContrato(org, inicio, fim, termos);
  repo.salvar([...carregarContratos(), contrato]);

  registrarTransacao(ctx.usuario, "cadastrar_contrato", { id: contrato.id, organizacaoId: org });
  logger.sucesso(`Contrato cadastrado com sucesso! ID: ${contrato.id}`);
}

function listarContratos(opcoes: Record<string, string>): void {
  const org = opcoes["org"]?.trim();
  const contratos = carregarContratos().filter((c) => !org || c.organizacaoId === org);

  if (contratos.length === 0) {
    logger.info("Nenhum contrato encontrado.");
    return;
  }

  console.log("\n--- Contratos ---");
  for (const c of contratos) {
    console.log(`ID: ${c.id} | Org: ${c.organizacaoId} | Vigência: ${c.dataInicio} até ${c.dataFim}`);
  }
}

function consultarContrato(opcoes: Record<string, string>): void {
  const id = opcoes["id"]?.trim();
  if (!id) {
    logger.erro("Uso: contrato consultar --id <CONTRATO_ID>");
    return;
  }

  const c = carregarContratos().find((item) => item.id === id);
  if (!c) {
    logger.erro(`Nenhum contrato encontrado com o ID '${id}'.`);
    return;
  }

  console.log("\n--- Detalhes do contrato ---");
  console.log(`ID: ${c.id}`);
  console.log(`Organização: ${c.organizacaoId}`);
  console.log(`Início: ${c.dataInicio}`);
  console.log(`Fim: ${c.dataFim}`);
  console.log(`Termos: ${c.termos}`);
  console.log(`Criado em: ${c.criadoEm}`);
}

function atualizarContrato(opcoes: Record<string, string>, ctx: Contexto): void {
  const id = opcoes["id"]?.trim();
  if (!id) {
    logger.erro("Uso: contrato atualizar --id <CONTRATO_ID> [--inicio AAAA-MM-DD] [--fim AAAA-MM-DD] [--termos TEXTO]");
    return;
  }

  const { inicio, fim, termos } = { inicio: opcoes["inicio"], fim: opcoes["fim"], termos: opcoes["termos"] };
  if (!inicio && !fim && !termos) {
    logger.erro("Informe ao menos um campo para atualizar (--inicio, --fim ou --termos).");
    return;
  }

  const lista = carregarContratos();
  const indice = lista.findIndex((c) => c.id === id);
  if (indice === -1) {
    logger.erro(`Nenum contrato encontrado com o ID '${id}'.`);
    return;
  }

  const atual = lista[indice];
  const atualizado = new Contrato(
    atual.id,
    atual.organizacaoId,
    inicio ?? atual.dataInicio,
    fim ?? atual.dataFim,
    termos ?? atual.termos,
    atual.criadoEm
  );
  atualizado.validar();

  lista[indice] = atualizado;
  repo.salvar(lista);

  const campos = [inicio && "inicio", fim && "fim", termos && "termos"].filter(Boolean);
  registrarTransacao(ctx.usuario, "atualizar_contrato", { id, campos });
  logger.sucesso(`Contrato '${id}' atualizado com sucesso.`);
}

function removerContrato(opcoes: Record<string, string>, ctx: Contexto): void {
  const id = opcoes["id"]?.trim();
  if (!id) {
    logger.erro("Uso: contrato remover --id <CONTRATO_ID>");
    return;
  }

  const lista = carregarContratos();
  if (!lista.some((c) => c.id === id)) {
    logger.erro(`Nenhum contrato encontrado com o ID '${id}'.`);
    return;
  }

  repo.salvar(lista.filter((c) => c.id !== id));

  registrarTransacao(ctx.usuario, "remover_contrato", { id });
  logger.sucesso(`Contrato '${id}' removido com sucesso.`);
}

export function executarContratos(subAcao: string, opcoes: Record<string, string>, ctx: Contexto): void {
  switch (subAcao) {
    case "criar":
      criarContrato(opcoes, ctx);
      break;
    case "listar":
      listarContratos(opcoes);
      break;
    case "consultar":
      consultarContrato(opcoes);
      break;
    case "atualizar":
      atualizarContrato(opcoes, ctx);
      break;
    case "remover":
      removerContrato(opcoes, ctx);
      break;
    default:
      logger.erro("Ação inválida. Use: contrato criar | listar | consultar | atualizar | remover.");
  }
}