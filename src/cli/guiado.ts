import {
  perguntar,
  perguntarSenhaComValidacao,
  perguntarComValidacao,
  aguardarMenu,
  OperacaoCanceladaError,
} from "./entrada.js";
import { executarOrganizacoes } from "../commands/organizacoes.js";
import { executarLotes } from "../commands/lotes.js";
import { executarEquipamentos } from "../commands/equipamentos.js";
import { executarRelatorios } from "../commands/relatorios.js";
import { executarContratos } from "../commands/contratos.js";
import { executarUsuarios } from "../commands/usuarios.js";
import { visualizarParametros, executarParametros } from "../commands/parametros.js";
import { verificarEExibirHistorico } from "../commands/historico.js";
import { temPermissao, Acao } from "../auth/permissoes.js";
import { comTratamento } from "../utils/tratamento.js";
import { registrarAtividade, sessaoExpirada } from "../auth/sessao.js";
import { SessaoExpiradaError } from "./entrada.js";
import { logger } from "../utils/logger.js";
import { TIPOS_ORGANIZACAO_VALIDOS, Organizacao } from "../models/organizacao.js";
import { ESTADOS_FISICOS_VALIDOS, Equipamento, EstadoFisico, HIERARQUIA_ESTADO } from "../models/equipamento.js";
import { Lote } from "../models/lote.js";
import { Contrato } from "../models/contrato.js";
import { exibirEasterEgg } from "./easteregg.js";
import { cnpjValido } from "../utils/cnpj.js";
import { Repositorio } from "../persistence/repositorio.js";
import { ARQ_ORGANIZACOES, ARQ_LOTES, ARQ_EQUIPAMENTOS, ARQ_CONTRATOS } from "../config/caminhos.js";
import { PAPEIS_CRIAVEIS } from "../auth/papeis.js";
import { buscarCredencial } from "../auth/credenciais.js";

type Contexto = { usuario: string; papel: string };

// ============================================================
// ACESSO E PERMISSÃO
// ============================================================

// Confere sessão e permissão. Retorna true se a ação é permitida.
function verificarAcesso(ctx: Contexto, acao: Acao, avisar: boolean): boolean {
  if (sessaoExpirada()) throw new SessaoExpiradaError();
  registrarAtividade();

  if (temPermissao(ctx.papel, acao)) return true;

  if (avisar) {
    logger.erro(`Acesso negado. Seu papel '${ctx.papel}' não tem permissão para a ação '${acao}'.`);
  }
  return false;
}

function executarAcao(ctx: Contexto, acao: Acao, handler: () => void): void {
  if (!verificarAcesso(ctx, acao, true)) return;
  comTratamento(handler);
}

// Consulta de apoio usada DENTRO de um fluxo (listagem, pré-visualização).
// avisar = false -> sem permissão, simplesmente não mostra nada.
function consultaAuxiliar(ctx: Contexto, acao: Acao, handler: () => void, avisar = true): boolean {
  if (!verificarAcesso(ctx, acao, avisar)) return false;
  comTratamento(handler);
  return true;
}

// Barra ANTES da primeira pergunta quem não tem permissão (evita preencher tudo para ser negado no fim).
async function liberar(ctx: Contexto, acao: Acao): Promise<boolean> {
  if (verificarAcesso(ctx, acao, true)) return true;
  await aguardarMenu();
  return false;
}

// ============================================================
// BUSCAS LOCAIS (validação imediata)
// ============================================================

function existeOrganizacao(id: string): boolean {
  return new Repositorio<Organizacao>(ARQ_ORGANIZACOES).carregar().some((o) => o.id === id);
}

function existeLote(id: string): boolean {
  return new Repositorio<Lote>(ARQ_LOTES).carregar().some((l) => l.id === id);
}

function existeEquipamento(id: string): boolean {
  return new Repositorio<Equipamento>(ARQ_EQUIPAMENTOS).carregar().some((e) => e.id === id);
}

function existeContrato(id: string): boolean {
  return new Repositorio<Contrato>(ARQ_CONTRATOS).carregar().some((c) => c.id === id);
}

function buscarEquipamento(id: string): Equipamento | undefined {
  return new Repositorio<Equipamento>(ARQ_EQUIPAMENTOS).carregar().find((e) => e.id === id);
}

function buscarContrato(id: string): Contrato | undefined {
  return new Repositorio<Contrato>(ARQ_CONTRATOS).carregar().find((c) => c.id === id);
}

// Organização que já usa esse CNPJ (comparando só os dígitos), ignorando uma organização (na edição).
function organizacaoPorCnpj(cnpj: string, ignorarId?: string): Organizacao | undefined {
  const digitos = cnpj.replace(/\D/g, "");
  return new Repositorio<Organizacao>(ARQ_ORGANIZACOES)
    .carregar()
    .find((o) => o.id !== ignorarId && o.cnpj.replace(/\D/g, "") === digitos);
}

// Valores já usados em campos de texto livre, para manter a grafia consistente.
function tiposDeEquipamentoCadastrados(): string[] {
  const tipos = new Repositorio<Equipamento>(ARQ_EQUIPAMENTOS).carregar().map((e) => e.tipo);
  return [...new Set(tipos)].sort();
}

function transportadorasCadastradas(): string[] {
  const nomes = new Repositorio<Lote>(ARQ_LOTES).carregar().map((l) => l.transportadora);
  return [...new Set(nomes)].sort();
}

function mostrarSugestoes(rotulo: string, valores: string[]): void {
  if (valores.length > 0) console.log(`${rotulo}: ${valores.join(" | ")}`);
}

// ============================================================
// VALIDAÇÕES DE DATA (espelham as regras dos models)
// ============================================================

function validarFormatoData(val: string): true | string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val) || isNaN(new Date(val).getTime())) {
    return "Data em formato inválido. Use AAAA-MM-DD.";
  }
  return true;
}

// Regras do Lote: não pode ser futura nem ter mais de 90 dias.
function validarDataLote(val: string): true | string {
  const formato = validarFormatoData(val);
  if (formato !== true) return formato;

  const data = new Date(val);
  if (data > new Date()) return "Não é permitido cadastrar lotes com data futura.";

  const limite = new Date();
  limite.setDate(limite.getDate() - 90);
  if (data < limite) return "Não é permitido cadastrar lotes com data de entrada superior a 90 dias passados.";

  return true;
}

// Percentual dos parâmetros globais. Aceita vírgula (12,5) porque o comando usa parseFloat.
function validarPercentual(val: string): true | string {
  const n = Number(val.replace(",", "."));
  if (val.trim() === "" || isNaN(n)) return "Digite um número válido (ex: 12.5).";
  if (n < 0 || n > 100) return "O valor deve estar entre 0 e 100.";
  return true;
}

// ============================================================
// ALVOS DE CONSULTA
// Descrevem, para cada entidade, como validar um ID, listar e mostrar um registro.
// ============================================================

type Alvo = {
  existe: (id: string) => boolean;
  naoEncontrado: (id: string) => string;
  acaoLista: Acao;
  listar: (ctx: Contexto) => void;
  acaoDetalhe: Acao;
  detalhar: (ctx: Contexto, id: string) => void;
};

const ALVO_ORGANIZACAO: Alvo = {
  existe: existeOrganizacao,
  naoEncontrado: (id) => `Nenhuma organização encontrada com o ID '${id}'. Digite '?' para listar.`,
  acaoLista: "consultar_cadastros",
  listar: (ctx) => executarOrganizacoes("listar", {}, ctx),
  acaoDetalhe: "consultar_cadastros",
  detalhar: (ctx, id) => executarOrganizacoes("consultar", { id }, ctx),
};

const ALVO_LOTE: Alvo = {
  existe: existeLote,
  naoEncontrado: (id) => `Nenhum lote encontrado com o ID '${id}'. Digite '?' para listar.`,
  acaoLista: "consultar_cadastros",
  listar: (ctx) => executarLotes("listar", {}, ctx),
  acaoDetalhe: "consultar_cadastros",
  detalhar: (ctx, id) => executarLotes("consultar", { id }, ctx),
};

const ALVO_EQUIPAMENTO: Alvo = {
  existe: existeEquipamento,
  naoEncontrado: (id) => `Equipamento '${id}' não encontrado. Digite '?' para listar.`,
  acaoLista: "consultar_cadastros",
  listar: (ctx) => executarEquipamentos("listar", {}, ctx),
  acaoDetalhe: "consultar_cadastros",
  detalhar: (ctx, id) => executarEquipamentos("consultar", { id }, ctx),
};

function listarEquipamentosPorStatus(ctx: Contexto, status: string): void {
  console.log(`(Mostrando só equipamentos com status '${status}'. Para ver todos, use "Listar Equipamentos".)`);
  executarEquipamentos("listar", { status }, ctx);
}

// Quem pode ser triado: ainda "recebido". Também são os candidatos a remoção.
const ALVO_EQUIPAMENTO_RECEBIDO: Alvo = {
  ...ALVO_EQUIPAMENTO,
  listar: (ctx) => listarEquipamentosPorStatus(ctx, "recebido"),
};

// Quem pode ir para desmonte: já triado.
const ALVO_EQUIPAMENTO_TRIADO: Alvo = {
  ...ALVO_EQUIPAMENTO,
  listar: (ctx) => listarEquipamentosPorStatus(ctx, "triado"),
};

const ALVO_CONTRATO: Alvo = {
  existe: existeContrato,
  naoEncontrado: (id) => `Nenhum contrato encontrado com o ID '${id}'. Digite '?' para listar.`,
  acaoLista: "consultar_cadastros",
  listar: (ctx) => executarContratos("listar", {}, ctx),
  acaoDetalhe: "consultar_cadastros",
  detalhar: (ctx, id) => executarContratos("consultar", { id }, ctx),
};

const ALVO_USUARIO: Alvo = {
  existe: (nome) => !!buscarCredencial(nome),
  naoEncontrado: (nome) => `Usuário '${nome}' não encontrado. Digite '?' para listar.`,
  acaoLista: "gerenciar_usuarios",
  listar: (ctx) => executarUsuarios("listar", {}, ctx),
  acaoDetalhe: "gerenciar_usuarios",
  detalhar: (ctx, nome) => executarUsuarios("consultar", { usuario: nome }, ctx),
};

function pedidoDeLista(val: string): boolean {
  const entrada = val.trim().toLowerCase();
  return entrada === "?" || entrada === "listar" || entrada === "ajuda";
}

function listarAlvo(ctx: Contexto, alvo: Alvo): void {
  consultaAuxiliar(ctx, alvo.acaoLista, () => alvo.listar(ctx));
}

// Pergunta um ID/nome com atalho de listagem ('?', 'listar' ou 'ajuda') e validação de existência.
// "extra" permite uma regra a mais (ex.: não remover o próprio usuário).
function perguntarId(
  ctx: Contexto,
  alvo: Alvo,
  texto: string,
  extra?: (val: string) => true | string
): Promise<string> {
  return perguntarComValidacao(texto, (val) => {
    if (pedidoDeLista(val)) {
      listarAlvo(ctx, alvo);
      return "Escolha um dos registros listados acima.";
    }
    if (!alvo.existe(val)) return alvo.naoEncontrado(val);
    return extra ? extra(val) : true;
  });
}

// Mostra o registro escolhido (dados atuais antes de editar, ou o que será removido).
function mostrarRegistro(ctx: Contexto, alvo: Alvo, id: string, titulo: string): void {
  consultaAuxiliar(
    ctx,
    alvo.acaoDetalhe,
    () => {
      console.log(`\n--- ${titulo} ---`);
      alvo.detalhar(ctx, id);
      console.log("");
    },
    false
  );
}

// ============================================================
// SUBMENU ORGANIZAÇÕES
// ============================================================
async function submenuOrganizacoes(ctx: Contexto): Promise<void> {
  while (true) {
    console.log("\n--- GERENCIAR ORGANIZAÇÕES ---");
    console.log("1. Cadastrar Organização");
    console.log("2. Listar Organizações");
    console.log("3. Consultar Organização");
    console.log("4. Atualizar Organização");
    console.log("5. Remover Organização");
    console.log("0. Voltar");

    const op = (await perguntar("Escolha uma opção: ")).trim();
    if (op === "0") break;

    try {
      switch (op) {
        case "1": {
          if (!(await liberar(ctx, "cadastrar_organizacao"))) break;

          const nome = await perguntarComValidacao("Nome da organização (0 p/ cancelar): ", (val) => {
            if (val.length < 3) return "Razão social deve possuir ao menos 3 caracteres.";
            return true;
          });

          const cnpj = await perguntarComValidacao("CNPJ (ex: 11.222.333/0001-81, 0 p/ cancelar): ", (val) => {
            if (!cnpjValido(val)) return `CNPJ '${val}' é inválido.`;
            const existente = organizacaoPorCnpj(val);
            if (existente) return `CNPJ já cadastrado para '${existente.razosocial}' (ID: ${existente.id}).`;
            return true;
          });

          console.log(`Tipos válidos: ${TIPOS_ORGANIZACAO_VALIDOS.join(" | ")}`);
          const tipo = await perguntarComValidacao("Tipo (0 p/ cancelar): ", (val) => {
            if (!TIPOS_ORGANIZACAO_VALIDOS.includes(val as any)) {
              return `Tipo inválido. Opções válidas: ${TIPOS_ORGANIZACAO_VALIDOS.join(" | ")}`;
            }
            return true;
          });

          executarAcao(ctx, "cadastrar_organizacao", () =>
            executarOrganizacoes("criar", { nome, cnpj, tipo }, ctx)
          );
          await aguardarMenu();
          break;
        }
        case "2": {
          executarAcao(ctx, "consultar_cadastros", () => executarOrganizacoes("listar", {}, ctx));
          await aguardarMenu();
          break;
        }
        case "3": {
          if (!(await liberar(ctx, "consultar_cadastros"))) break;
          const id = await perguntarId(ctx, ALVO_ORGANIZACAO, "ID da Organização (0 p/ cancelar, '?' p/ listar): ");
          executarAcao(ctx, "consultar_cadastros", () => executarOrganizacoes("consultar", { id }, ctx));
          await aguardarMenu();
          break;
        }
        case "4": {
          if (!(await liberar(ctx, "cadastrar_organizacao"))) break;
          const id = await perguntarId(ctx, ALVO_ORGANIZACAO, "ID da Organização a atualizar (0 p/ cancelar, '?' p/ listar): ");
          mostrarRegistro(ctx, ALVO_ORGANIZACAO, id, "Dados atuais da organização");

          const nome = await perguntarComValidacao("Novo Nome (ENTER para manter, 0 p/ cancelar): ", (val) => {
            if (val && val.length < 3) return "Razão social deve possuir ao menos 3 caracteres.";
            return true;
          });

          const cnpj = await perguntarComValidacao("Novo CNPJ (ENTER para manter, 0 p/ cancelar): ", (val) => {
            if (!val) return true;
            if (!cnpjValido(val)) return `CNPJ '${val}' é inválido.`;
            const existente = organizacaoPorCnpj(val, id);
            if (existente) return `CNPJ já cadastrado para '${existente.razosocial}' (ID: ${existente.id}).`;
            return true;
          });

          console.log(`Tipos válidos: ${TIPOS_ORGANIZACAO_VALIDOS.join(" | ")}`);
          const tipo = await perguntarComValidacao("Novo Tipo (ENTER para manter, 0 p/ cancelar): ", (val) => {
            if (val && !TIPOS_ORGANIZACAO_VALIDOS.includes(val as any)) {
              return `Tipo inválido. Opções válidas: ${TIPOS_ORGANIZACAO_VALIDOS.join(" | ")}`;
            }
            return true;
          });

          const opts: Record<string, string> = { id };
          if (nome) opts.nome = nome;
          if (cnpj) opts.cnpj = cnpj;
          if (tipo) opts.tipo = tipo;

          executarAcao(ctx, "cadastrar_organizacao", () => executarOrganizacoes("atualizar", opts, ctx));
          await aguardarMenu();
          break;
        }
        case "5": {
          if (!(await liberar(ctx, "cadastrar_organizacao"))) break;
          const id = await perguntarId(ctx, ALVO_ORGANIZACAO, "ID da Organização a remover (0 p/ cancelar, '?' p/ listar): ");
          mostrarRegistro(ctx, ALVO_ORGANIZACAO, id, "Organização selecionada para remoção");
          executarAcao(ctx, "cadastrar_organizacao", () => executarOrganizacoes("remover", { id }, ctx));
          await aguardarMenu();
          break;
        }
        default:
          logger.erro("Opção inválida.");
          await aguardarMenu();
      }
    } catch (erro) {
      if (erro instanceof OperacaoCanceladaError) {
        logger.aviso("Operação cancelada pelo usuário.");
      } else {
        throw erro;
      }
    }
  }
}

// ============================================================
// SUBMENU LOTES
// ============================================================
async function submenuLotes(ctx: Contexto): Promise<void> {
  while (true) {
    console.log("\n--- GERENCIAR LOTES ---");
    console.log("1. Registrar Lote");
    console.log("2. Listar Lotes");
    console.log("3. Consultar Lote");
    console.log("4. Atualizar Lote");
    console.log("5. Remover Lote");
    console.log("0. Voltar");

    const op = (await perguntar("Escolha uma opção: ")).trim();
    if (op === "0") break;

    try {
      switch (op) {
        case "1": {
          if (!(await liberar(ctx, "registrar_lote"))) break;
          const org = await perguntarId(ctx, ALVO_ORGANIZACAO, "ID da Organização de origem (0 p/ cancelar, '?' p/ listar): ");

          const nf = await perguntarComValidacao("Número da Nota Fiscal (0 p/ cancelar): ", (val) => {
            if (!val) return "Nota fiscal é obrigatória.";
            return true;
          });

          mostrarSugestoes("Transportadoras já usadas", transportadorasCadastradas());
          const transp = await perguntarComValidacao("Nome da transportadora (0 p/ cancelar): ", (val) => {
            if (!val) return "Nome da transportadora é obrigatório.";
            return true;
          });

          const data = await perguntarComValidacao(
            "Data do Lote (AAAA-MM-DD, até 90 dias atrás, ENTER p/ hoje, 0 p/ cancelar): ",
            (val) => (val ? validarDataLote(val) : true)
          );

          const opts: Record<string, string> = { org, nf, transp };
          if (data) opts.data = data;
          executarAcao(ctx, "registrar_lote", () => executarLotes("criar", opts, ctx));
          await aguardarMenu();
          break;
        }
        case "2": {
          executarAcao(ctx, "consultar_cadastros", () => executarLotes("listar", {}, ctx));
          await aguardarMenu();
          break;
        }
        case "3": {
          if (!(await liberar(ctx, "consultar_cadastros"))) break;
          const id = await perguntarId(ctx, ALVO_LOTE, "ID do Lote (0 p/ cancelar, '?' p/ listar): ");
          executarAcao(ctx, "consultar_cadastros", () => executarLotes("consultar", { id }, ctx));
          await aguardarMenu();
          break;
        }
        case "4": {
          if (!(await liberar(ctx, "registrar_lote"))) break;
          const id = await perguntarId(ctx, ALVO_LOTE, "ID do Lote a atualizar (0 p/ cancelar, '?' p/ listar): ");
          mostrarRegistro(ctx, ALVO_LOTE, id, "Dados atuais do lote");

          const nf = await perguntar("Nova Nota Fiscal (ENTER para manter, 0 p/ cancelar): ");
          if (nf.trim() === "0") throw new OperacaoCanceladaError();

          mostrarSugestoes("Transportadoras já usadas", transportadorasCadastradas());
          const transp = await perguntar("Nova Transportadora (ENTER para manter, 0 p/ cancelar): ");
          if (transp.trim() === "0") throw new OperacaoCanceladaError();

          const data = await perguntarComValidacao(
            "Nova Data (AAAA-MM-DD, até 90 dias atrás, ENTER para manter, 0 p/ cancelar): ",
            (val) => (val ? validarDataLote(val) : true)
          );

          const opts: Record<string, string> = { id };
          if (nf.trim()) opts.nf = nf.trim();
          if (transp.trim()) opts.transp = transp.trim();
          if (data) opts.data = data;

          executarAcao(ctx, "registrar_lote", () => executarLotes("atualizar", opts, ctx));
          await aguardarMenu();
          break;
        }
        case "5": {
          if (!(await liberar(ctx, "registrar_lote"))) break;
          const id = await perguntarId(ctx, ALVO_LOTE, "ID do Lote a remover (0 p/ cancelar, '?' p/ listar): ");
          mostrarRegistro(ctx, ALVO_LOTE, id, "Lote selecionado para remoção");
          executarAcao(ctx, "registrar_lote", () => executarLotes("remover", { id }, ctx));
          await aguardarMenu();
          break;
        }
        default:
          logger.erro("Opção inválida.");
          await aguardarMenu();
      }
    } catch (erro) {
      if (erro instanceof OperacaoCanceladaError) {
        logger.aviso("Operação cancelada pelo usuário.");
      } else {
        throw erro;
      }
    }
  }
}

// ============================================================
// SUBMENU EQUIPAMENTOS
// ============================================================
async function submenuEquipamentos(ctx: Contexto): Promise<void> {
  while (true) {
    console.log("\n--- GERENCIAR EQUIPAMENTOS ---");
    console.log("1. Cadastrar Equipamento");
    console.log("2. Listar Equipamentos");
    console.log("3. Consultar Rastreabilidade");
    console.log("4. Triar Equipamento");
    console.log("5. Mover para Desmonte");
    console.log("6. Alterar Estado Físico");
    console.log("7. Atualizar Equipamento");
    console.log("8. Remover Equipamento");
    console.log("0. Voltar");

    const op = (await perguntar("Escolha uma opção: ")).trim();
    if (op === "0") break;

    try {
      switch (op) {
        case "1": {
          if (!(await liberar(ctx, "cadastrar_equipamento"))) break;

          const id = await perguntarComValidacao(
            "ID/Código do Equipamento (ENTER p/ auto, 0 p/ cancelar, '?' p/ ver os já cadastrados): ",
            (val) => {
              if (pedidoDeLista(val)) {
                listarAlvo(ctx, ALVO_EQUIPAMENTO);
                return "Informe um código que não esteja na lista acima, ou ENTER para gerar automaticamente.";
              }
              if (val && existeEquipamento(val)) return `Já existe um equipamento com o código '${val}'.`;
              return true;
            }
          );

          const lote = await perguntarId(ctx, ALVO_LOTE, "ID do Lote (0 p/ cancelar, '?' p/ listar): ");

          mostrarSugestoes("Tipos já cadastrados", tiposDeEquipamentoCadastrados());
          const tipo = await perguntarComValidacao("Tipo (ex: notebook, pc, monitor, 0 p/ cancelar): ", (val) => {
            if (!val) return "Tipo é obrigatório.";
            return true;
          });

          const modelo = await perguntarComValidacao("Modelo (0 p/ cancelar): ", (val) => {
            if (!val) return "Modelo é obrigatório.";
            return true;
          });

          console.log(`Estados físicos válidos: ${ESTADOS_FISICOS_VALIDOS.join(" | ")}`);
          const estado = await perguntarComValidacao("Estado físico (0 p/ cancelar): ", (val) => {
            if (!ESTADOS_FISICOS_VALIDOS.includes(val as any)) {
              return `Estado inválido. Opções: ${ESTADOS_FISICOS_VALIDOS.join(" | ")}`;
            }
            return true;
          });

          executarAcao(ctx, "cadastrar_equipamento", () =>
            executarEquipamentos("criar", { id, lote, tipo, modelo, estado }, ctx)
          );
          await aguardarMenu();
          break;
        }
        case "2": {
          executarAcao(ctx, "consultar_cadastros", () => executarEquipamentos("listar", {}, ctx));
          await aguardarMenu();
          break;
        }
        case "3": {
          if (!(await liberar(ctx, "rastrear_equipamento"))) break;
          const id = await perguntarId(ctx, ALVO_EQUIPAMENTO, "ID do Equipamento (0 p/ cancelar, '?' p/ listar): ");
          executarAcao(ctx, "rastrear_equipamento", () => executarRelatorios("rastrear", { id }));
          await aguardarMenu();
          break;
        }
        case "4": {
          if (!(await liberar(ctx, "concluir_triagem"))) break;
          const id = await perguntarId(ctx, ALVO_EQUIPAMENTO_RECEBIDO, "ID do Equipamento para triar (0 p/ cancelar, '?' p/ listar): ");
          mostrarRegistro(ctx, ALVO_EQUIPAMENTO, id, "Equipamento selecionado para triagem");
          executarAcao(ctx, "concluir_triagem", () => executarEquipamentos("triar", { id }, ctx));
          await aguardarMenu();
          break;
        }
        case "5": {
          if (!(await liberar(ctx, "mover_desmonte"))) break;
          const id = await perguntarId(ctx, ALVO_EQUIPAMENTO_TRIADO, "ID do Equipamento para desmonte (0 p/ cancelar, '?' p/ listar): ");
          mostrarRegistro(ctx, ALVO_EQUIPAMENTO, id, "Equipamento selecionado para desmonte");
          executarAcao(ctx, "mover_desmonte", () => executarEquipamentos("desmonte", { id }, ctx));
          await aguardarMenu();
          break;
        }
        case "6": {
          if (!(await liberar(ctx, "alterar_estado"))) break;
          const id = await perguntarId(ctx, ALVO_EQUIPAMENTO, "ID do Equipamento (0 p/ cancelar, '?' p/ listar): ");
          mostrarRegistro(ctx, ALVO_EQUIPAMENTO, id, "Situação atual do equipamento");

          const atual = buscarEquipamento(id)!;

          console.log(`Estados válidos: ${Object.keys(HIERARQUIA_ESTADO).join(" | ")}`);
          const novo = await perguntarComValidacao("Novo Estado Físico (0 p/ cancelar): ", (val) => {
            if (!(val in HIERARQUIA_ESTADO)) {
              return `Estado inválido. Opções válidas: ${Object.keys(HIERARQUIA_ESTADO).join(" | ")}`;
            }
            if (val === atual.estadoFisico) return `O equipamento já está no estado '${val}'.`;
            return true;
          });

          // Queda de 2+ níveis exige justificativa (regra do comando): avisa já aqui.
          const queda = HIERARQUIA_ESTADO[atual.estadoFisico] - HIERARQUIA_ESTADO[novo as EstadoFisico];
          const justificativaObrigatoria = queda >= 2;

          const justificativa = await perguntarComValidacao(
            justificativaObrigatoria
              ? "Justificativa (obrigatória: queda de 2 ou mais níveis, 0 p/ cancelar): "
              : "Justificativa (ENTER para omitir, 0 p/ cancelar): ",
            (val) => {
              if (justificativaObrigatoria && !val) return "Justificativa obrigatória para queda de 2 ou mais níveis.";
              return true;
            }
          );

          executarAcao(ctx, "alterar_estado", () =>
            executarEquipamentos("estado", { id, novo, justificativa }, ctx)
          );
          await aguardarMenu();
          break;
        }
        case "7": {
          if (!(await liberar(ctx, "cadastrar_equipamento"))) break;
          const id = await perguntarId(ctx, ALVO_EQUIPAMENTO, "ID do Equipamento a atualizar (0 p/ cancelar, '?' p/ listar): ");
          mostrarRegistro(ctx, ALVO_EQUIPAMENTO, id, "Dados atuais do equipamento");

          mostrarSugestoes("Tipos já cadastrados", tiposDeEquipamentoCadastrados());
          const tipo = await perguntar("Novo Tipo (ENTER para manter, 0 p/ cancelar): ");
          if (tipo.trim() === "0") throw new OperacaoCanceladaError();

          const modelo = await perguntar("Novo Modelo (ENTER para manter, 0 p/ cancelar): ");
          if (modelo.trim() === "0") throw new OperacaoCanceladaError();

          const opts: Record<string, string> = { id };
          if (tipo.trim()) opts.tipo = tipo.trim();
          if (modelo.trim()) opts.modelo = modelo.trim();

          executarAcao(ctx, "cadastrar_equipamento", () => executarEquipamentos("atualizar", opts, ctx));
          await aguardarMenu();
          break;
        }
        case "8": {
          if (!(await liberar(ctx, "cadastrar_equipamento"))) break;
          const id = await perguntarId(ctx, ALVO_EQUIPAMENTO_RECEBIDO, "ID do Equipamento a remover (0 p/ cancelar, '?' p/ listar): ");
          mostrarRegistro(ctx, ALVO_EQUIPAMENTO, id, "Equipamento selecionado para remoção");
          executarAcao(ctx, "cadastrar_equipamento", () => executarEquipamentos("remover", { id }, ctx));
          await aguardarMenu();
          break;
        }
        default:
          logger.erro("Opção inválida.");
          await aguardarMenu();
      }
    } catch (erro) {
      if (erro instanceof OperacaoCanceladaError) {
        logger.aviso("Operação cancelada pelo usuário.");
      } else {
        throw erro;
      }
    }
  }
}

// ============================================================
// SUBMENU CONTRATOS
// ============================================================
async function submenuContratos(ctx: Contexto): Promise<void> {
  while (true) {
    console.log("\n--- GERENCIAR CONTRATOS ---");
    console.log("1. Cadastrar Contrato");
    console.log("2. Listar Contratos");
    console.log("3. Consultar Contrato");
    console.log("4. Atualizar Contrato");
    console.log("5. Remover Contrato");
    console.log("0. Voltar");

    const op = (await perguntar("Escolha uma opção: ")).trim();
    if (op === "0") break;

    try {
      switch (op) {
        case "1": {
          if (!(await liberar(ctx, "cadastrar_contrato"))) break;
          const org = await perguntarId(ctx, ALVO_ORGANIZACAO, "ID da Organização (0 p/ cancelar, '?' p/ listar): ");

          const inicio = await perguntarComValidacao("Data Início (AAAA-MM-DD, 0 p/ cancelar): ", validarFormatoData);

          const fim = await perguntarComValidacao("Data Fim (AAAA-MM-DD, 0 p/ cancelar): ", (val) => {
            const formato = validarFormatoData(val);
            if (formato !== true) return formato;
            if (new Date(val).getTime() <= new Date(inicio).getTime()) {
              return "A data de término do contrato deve ser posterior à data de início.";
            }
            return true;
          });

          const termos = await perguntar("Termos (ENTER p/ padrão, 0 p/ cancelar): ");
          if (termos.trim() === "0") throw new OperacaoCanceladaError();

          const opts: Record<string, string> = { org, inicio, fim };
          if (termos.trim()) opts.termos = termos.trim();
          executarAcao(ctx, "cadastrar_contrato", () => executarContratos("criar", opts, ctx));
          await aguardarMenu();
          break;
        }
        case "2": {
          executarAcao(ctx, "consultar_cadastros", () => executarContratos("listar", {}, ctx));
          await aguardarMenu();
          break;
        }
        case "3": {
          if (!(await liberar(ctx, "consultar_cadastros"))) break;
          const id = await perguntarId(ctx, ALVO_CONTRATO, "ID do Contrato (0 p/ cancelar, '?' p/ listar): ");
          executarAcao(ctx, "consultar_cadastros", () => executarContratos("consultar", { id }, ctx));
          await aguardarMenu();
          break;
        }
        case "4": {
          if (!(await liberar(ctx, "cadastrar_contrato"))) break;
          const id = await perguntarId(ctx, ALVO_CONTRATO, "ID do Contrato a atualizar (0 p/ cancelar, '?' p/ listar): ");
          mostrarRegistro(ctx, ALVO_CONTRATO, id, "Dados atuais do contrato");

          const atual = buscarContrato(id)!;

          const inicio = await perguntarComValidacao(
            "Nova Data Início (AAAA-MM-DD, ENTER para manter, 0 p/ cancelar): ",
            (val) => (val ? validarFormatoData(val) : true)
          );
          const inicioFinal = inicio || atual.dataInicio;

          // O fim é conferido contra o início que vai valer (o novo, se informado, ou o atual).
          const fim = await perguntarComValidacao(
            "Nova Data Fim (AAAA-MM-DD, ENTER para manter, 0 p/ cancelar): ",
            (val) => {
              if (val) {
                const formato = validarFormatoData(val);
                if (formato !== true) return formato;
              }
              const fimFinal = val || atual.dataFim;
              if (new Date(fimFinal).getTime() <= new Date(inicioFinal).getTime()) {
                return `A data de término (${fimFinal}) deve ser posterior à data de início (${inicioFinal}).`;
              }
              return true;
            }
          );

          const termos = await perguntar("Novos Termos (ENTER para manter, 0 p/ cancelar): ");
          if (termos.trim() === "0") throw new OperacaoCanceladaError();

          const opts: Record<string, string> = { id };
          if (inicio) opts.inicio = inicio;
          if (fim) opts.fim = fim;
          if (termos.trim()) opts.termos = termos.trim();

          executarAcao(ctx, "cadastrar_contrato", () => executarContratos("atualizar", opts, ctx));
          await aguardarMenu();
          break;
        }
        case "5": {
          if (!(await liberar(ctx, "cadastrar_contrato"))) break;
          const id = await perguntarId(ctx, ALVO_CONTRATO, "ID do Contrato a remover (0 p/ cancelar, '?' p/ listar): ");
          mostrarRegistro(ctx, ALVO_CONTRATO, id, "Contrato selecionado para remoção");
          executarAcao(ctx, "cadastrar_contrato", () => executarContratos("remover", { id }, ctx));
          await aguardarMenu();
          break;
        }
        default:
          logger.erro("Opção inválida.");
          await aguardarMenu();
      }
    } catch (erro) {
      if (erro instanceof OperacaoCanceladaError) {
        logger.aviso("Operação cancelada pelo usuário.");
      } else {
        throw erro;
      }
    }
  }
}

// ============================================================
// SUBMENU USUÁRIOS
// ============================================================
async function submenuUsuarios(ctx: Contexto): Promise<void> {
  while (true) {
    console.log("\n--- GERENCIAR USUÁRIOS ---");
    console.log("1. Cadastrar Usuário");
    console.log("2. Listar Usuários");
    console.log("3. Consultar Usuário");
    console.log("4. Atualizar Usuário");
    console.log("5. Remover Usuário");
    console.log("0. Voltar");

    const op = (await perguntar("Escolha uma opção: ")).trim();
    if (op === "0") break;

    try {
      switch (op) {
        case "1": {
          if (!(await liberar(ctx, "gerenciar_usuarios"))) break;

          const usuario = await perguntarComValidacao(
            "Nome do Usuário (0 p/ cancelar, '?' p/ ver os já cadastrados): ",
            (val) => {
              if (pedidoDeLista(val)) {
                listarAlvo(ctx, ALVO_USUARIO);
                return "Escolha um nome que não esteja na lista acima.";
              }
              if (!val) return "Nome de usuário é obrigatório.";
              if (buscarCredencial(val)) return "Usuário já existente no sistema.";
              return true;
            }
          );

          const senha = await perguntarSenhaComValidacao("Senha (mín. 8 caracteres, 0 p/ cancelar): ", (val) =>
            val.length >= 8 ? true : "A senha deve possuir pelo menos 8 caracteres."
          );

          console.log(`Papéis válidos: ${PAPEIS_CRIAVEIS.join(" | ")}`);
          const papel = await perguntarComValidacao("Papel (0 p/ cancelar): ", (val) => {
            if (!PAPEIS_CRIAVEIS.includes(val)) return `Papel inválido. Opções: ${PAPEIS_CRIAVEIS.join(" | ")}`;
            return true;
          });

          executarAcao(ctx, "gerenciar_usuarios", () =>
            executarUsuarios("criar", { usuario, senha, papel }, ctx)
          );
          await aguardarMenu();
          break;
        }
        case "2": {
          executarAcao(ctx, "gerenciar_usuarios", () => executarUsuarios("listar", {}, ctx));
          await aguardarMenu();
          break;
        }
        case "3": {
          if (!(await liberar(ctx, "gerenciar_usuarios"))) break;
          const usuario = await perguntarId(ctx, ALVO_USUARIO, "Nome do Usuário (0 p/ cancelar, '?' p/ listar): ");
          executarAcao(ctx, "gerenciar_usuarios", () => executarUsuarios("consultar", { usuario }, ctx));
          await aguardarMenu();
          break;
        }
        case "4": {
          if (!(await liberar(ctx, "gerenciar_usuarios"))) break;
          const usuario = await perguntarId(ctx, ALVO_USUARIO, "Nome do Usuário a atualizar (0 p/ cancelar, '?' p/ listar): ");
          mostrarRegistro(ctx, ALVO_USUARIO, usuario, "Dados atuais do usuário");

          const senha = await perguntarSenhaComValidacao("Nova Senha (ENTER para manter, 0 p/ cancelar): ", (val) =>
            val === "" || val.length >= 8 ? true : "A senha deve possuir pelo menos 8 caracteres."
          );

          // O papel de um administrador não pode ser alterado: nem pergunta.
          let papel = "";
          if (buscarCredencial(usuario)?.papel === "administrador") {
            logger.aviso("O papel de um administrador não pode ser alterado.");
          } else {
            console.log(`Papéis válidos: ${PAPEIS_CRIAVEIS.join(" | ")}`);
            papel = await perguntarComValidacao("Novo Papel (ENTER para manter, 0 p/ cancelar): ", (val) => {
              if (val && !PAPEIS_CRIAVEIS.includes(val)) {
                return `Papel inválido. Opções: ${PAPEIS_CRIAVEIS.join(" | ")}`;
              }
              return true;
            });
          }

          const opts: Record<string, string> = { usuario };
          if (senha) opts.senha = senha;
          if (papel) opts.papel = papel;

          executarAcao(ctx, "gerenciar_usuarios", () => executarUsuarios("atualizar", opts, ctx));
          await aguardarMenu();
          break;
        }
        case "5": {
          if (!(await liberar(ctx, "gerenciar_usuarios"))) break;
          const usuario = await perguntarId(ctx, ALVO_USUARIO, "Nome do Usuário a remover (0 p/ cancelar, '?' p/ listar): ", (val) => {
            if (val === ctx.usuario) return "Você não pode remover o próprio usuário.";
            if (buscarCredencial(val)?.papel === "administrador") {
              return "Usuários com papel de administrador não podem ser removidos.";
            }
            return true;
          });
          mostrarRegistro(ctx, ALVO_USUARIO, usuario, "Usuário selecionado para remoção");
          executarAcao(ctx, "gerenciar_usuarios", () => executarUsuarios("remover", { usuario }, ctx));
          await aguardarMenu();
          break;
        }
        default:
          logger.erro("Opção inválida.");
          await aguardarMenu();
      }
    } catch (erro) {
      if (erro instanceof OperacaoCanceladaError) {
        logger.aviso("Operação cancelada pelo usuário.");
      } else {
        throw erro;
      }
    }
  }
}

// ============================================================
// SUBMENU PARÂMETROS E HISTÓRICO
// ============================================================
async function submenuSistema(ctx: Contexto): Promise<void> {
  while (true) {
    console.log("\n--- SISTEMA E PARÂMETROS ---");
    console.log("1. Visualizar Parâmetros Globais");
    console.log("2. Definir Parâmetros Globais");
    console.log("3. Verificar e Exibir Histórico de Auditoria (Journal)");
    console.log("0. Voltar");

    const op = (await perguntar("Escolha uma opção: ")).trim();
    if (op === "0") break;

    try {
      switch (op) {
        case "1": {
          executarAcao(ctx, "configurar_parametros", () => visualizarParametros());
          await aguardarMenu();
          break;
        }
        case "2": {
          if (!(await liberar(ctx, "configurar_parametros"))) break;

          // Mostra os valores atuais antes de pedir os novos.
          consultaAuxiliar(ctx, "configurar_parametros", () => {
            console.log("\n--- Parâmetros atuais ---");
            visualizarParametros();
            console.log("");
          });

          const aliquota = await perguntarComValidacao("Alíquota de Imposto (%, 0 p/ cancelar): ", validarPercentual);
          const depreciacao = await perguntarComValidacao("Coeficiente de Depreciação (%, 0 p/ cancelar): ", validarPercentual);

          executarAcao(ctx, "configurar_parametros", () =>
            executarParametros(
              { aliquota: aliquota.replace(",", "."), depreciacao: depreciacao.replace(",", ".") },
              ctx
            )
          );
          await aguardarMenu();
          break;
        }
        case "3": {
          executarAcao(ctx, "consultar_historico", () => verificarEExibirHistorico());
          await aguardarMenu();
          break;
        }
        default:
          logger.erro("Opção inválida.");
          await aguardarMenu();
      }
    } catch (erro) {
      if (erro instanceof OperacaoCanceladaError) {
        logger.aviso("Operação cancelada pelo usuário.");
      } else {
        throw erro;
      }
    }
  }
}

// ============================================================
// MENU PRINCIPAL GUIADO
// ============================================================
export async function menuGuiado(ctx: Contexto): Promise<void> {
  while (true) {
    console.log("\n==========================================");
    console.log("        GREENCODE - PAINEL PRINCIPAL      ");
    console.log("==========================================");
    console.log("1. Gerenciar Organizações");
    console.log("2. Gerenciar Lotes");
    console.log("3. Gerenciar Equipamentos");
    console.log("4. Gerenciar Contratos de Coleta");
    console.log("5. Gerenciar Usuários");
    console.log("6. Sistema, Parâmetros e Histórico");
    console.log("7. Diretiva Wall-E 🌱");
    console.log("0. Sair");
    console.log("==========================================");

    const opcao = (await perguntar("Escolha um módulo: ")).trim();

    if (opcao === "0") break;

    switch (opcao) {
      case "1":
        await submenuOrganizacoes(ctx);
        break;
      case "2":
        await submenuLotes(ctx);
        break;
      case "3":
        await submenuEquipamentos(ctx);
        break;
      case "4":
        await submenuContratos(ctx);
        break;
      case "5":
        await submenuUsuarios(ctx);
        break;
      case "6":
        await submenuSistema(ctx);
        break;
      case "7":
        exibirEasterEgg();
        await aguardarMenu();
        break;
      default:
        logger.erro("Opção inválida.");
        await aguardarMenu();
    }
  }
}