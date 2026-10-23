import { Repositorio } from "../persistence/repositorio.js";
import { Organizacao, TipoOrganizacao } from "../models/organizacao.js";
import { Contrato } from "../models/contrato.js";
import { Lote } from "../models/lote.js";
import { FabricaEntidades } from "../models/fabrica.js";
import { RegraDeNegocioError } from "../models/erros.js";
import { ARQ_ORGANIZACOES, ARQ_CONTRATOS, ARQ_LOTES } from "../config/caminhos.js";
import { logger } from "../utils/logger.js";
import { registrarTransacao } from "../persistence/journal.js";

const repo = new Repositorio<Organizacao>(ARQ_ORGANIZACOES);

type Contexto = { usuario: string };

function carregarOrganizacoes(): Organizacao[] {
  return repo.carregar().map((item) => Organizacao.deJSON(item));
}

function somenteDigitos(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

function listarOrganizacoes(): void {
  const organizacoes = carregarOrganizacoes();

  if (organizacoes.length === 0) {
    logger.info("Nenhuma organização cadastrada.");
    return;
  }

  console.log("\n--- Organizações cadastradas ---");

  for (const org of organizacoes) {
    console.log(
      `ID: ${org.id} | Razão social: ${org.razosocial} | CNPJ: ${org.cnpj} | Tipo: ${org.tipo}`
    );
  }
}

function consultarOrganizacao(id: string): void {
  if (!id?.trim()) {
    logger.erro("Uso: organizacao consultar --id <ORG_ID>");
    return;
  }

  const organizacao = carregarOrganizacoes().find((org) => org.id === id.trim());

  if (!organizacao) {
    logger.erro(`Nenhuma organização encontrada com o ID '${id}'.`);
    return;
  }

  console.log("\n--- Detalhes da organização ---");
  console.log(`ID: ${organizacao.id}`);
  console.log(`Razão social: ${organizacao.razosocial}`);
  console.log(`CNPJ: ${organizacao.cnpj}`);
  console.log(`Tipo: ${organizacao.tipo}`);
  console.log(`Criada em: ${organizacao.criadoEm}`);
}

function criarOrganizacao(opcoes: Record<string, string>, ctx: Contexto): void {
  const nome = opcoes["nome"];
  const cnpj = opcoes["cnpj"];
  const tipo = opcoes["tipo"] as TipoOrganizacao | undefined;

  if (!nome || !cnpj || !tipo) {
    logger.erro(
      "Uso: organizacao criar --nome <RAZAO_SOCIAL> --cnpj <CNPJ> --tipo <gerador|operador_logistico|desmontadora|comprador>"
    );
    return;
  }

  const lista = carregarOrganizacoes();

  if (lista.some((org) => somenteDigitos(org.cnpj) === somenteDigitos(cnpj))) {
    logger.erro("Já existe uma organização cadastrada com este CNPJ.");
    return;
  }

  const org = FabricaEntidades.criarOrganizacao(nome, cnpj, tipo);

  repo.salvar([...lista, org]);

  registrarTransacao(ctx.usuario, "cadastrar_organizacao", { id: org.id, cnpj: org.cnpj });

  logger.sucesso(`Organização '${org.razosocial}' criada com sucesso! ID: ${org.id}`);
}

function atualizarOrganizacao(opcoes: Record<string, string>, ctx: Contexto): void {
  const id = opcoes["id"]?.trim();
  if (!id) {
    logger.erro("Uso: organizacao atualizar --id <ORG_ID> [--nome <RAZAO_SOCIAL>] [--cnpj <CNPJ>] [--tipo <TIPO>]");
    return;
  }

  const novoNome = opcoes["nome"];
  const novoCnpj = opcoes["cnpj"];
  const novoTipo = opcoes["tipo"] as TipoOrganizacao | undefined;

  if (!novoNome && !novoCnpj && !novoTipo) {
    logger.erro("Informe ao menos um campo para atualizar (--nome, --cnpj ou --tipo).");
    return;
  }

  const lista = carregarOrganizacoes();
  const indice = lista.findIndex((org) => org.id === id);
  if (indice === -1) {
    logger.erro(`Nenhuma organização encontrada com o ID '${id}'.`);
    return;
  }

  const atual = lista[indice];
  const cnpjFinal = novoCnpj ?? atual.cnpj;

  if (lista.some((org, i) => i !== indice && somenteDigitos(org.cnpj) === somenteDigitos(cnpjFinal))) {
    logger.erro("Já existe outra organização cadastrada com este CNPJ.");
    return;
  }

  const atualizada = new Organizacao(
    atual.id,
    novoNome ?? atual.razosocial,
    cnpjFinal,
    novoTipo ?? atual.tipo,
    atual.criadoEm
  );
  atualizada.validar();

  lista[indice] = atualizada;
  repo.salvar(lista);

  const campos = [novoNome && "nome", novoCnpj && "cnpj", novoTipo && "tipo"].filter(Boolean);
  registrarTransacao(ctx.usuario, "atualizar_organizacao", { id, campos });
  logger.sucesso(`Organização '${id}' atualizada com sucesso.`);
}

function removerOrganizacao(opcoes: Record<string, string>, ctx: Contexto): void {
  const id = opcoes["id"]?.trim();
  if (!id) {
    logger.erro("Uso: organizacao remover --id <ORG_ID>");
    return;
  }

  const lista = carregarOrganizacoes();
  if (!lista.some((org) => org.id === id)) {
    logger.erro(`Nenhuma organização encontrada com o ID '${id}'.`);
    return;
  }

  const temContratos = new Repositorio<Contrato>(ARQ_CONTRATOS).carregar().some((c) => c.organizacaoId === id);
  const temLotes = new Repositorio<Lote>(ARQ_LOTES).carregar().some((l) => l.organizacaoId === id);
  if (temContratos || temLotes) {
    throw new RegraDeNegocioError(
      "Não é possível remover uma organização que possui contratos ou lotes vinculados."
    );
  }

  repo.salvar(lista.filter((org) => org.id !== id));

  registrarTransacao(ctx.usuario, "remover_organizacao", { id });
  logger.sucesso(`Organização '${id}' removida com sucesso.`);
}

export function executarOrganizacoes(
  subAcao: string,
  opcoes: Record<string, string>,
  ctx: Contexto
): void {
  switch (subAcao) {
    case "criar":
      criarOrganizacao(opcoes, ctx);
      break;
    case "listar":
      listarOrganizacoes();
      break;
    case "consultar":
      consultarOrganizacao(opcoes["id"]);
      break;
    case "atualizar":
      atualizarOrganizacao(opcoes, ctx);
      break;
    case "remover":
      removerOrganizacao(opcoes, ctx);
      break;
    default:
      logger.erro("Ação inválida. Use: organizacao criar | listar | consultar | atualizar | remover.");
  }
}
