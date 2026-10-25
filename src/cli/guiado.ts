import { perguntar, perguntarSenha } from "./entrada.js";
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
import { TIPOS_ORGANIZACAO_VALIDOS } from "../models/organizacao.js";
import { ESTADOS_FISICOS_VALIDOS } from "../models/equipamento.js";
import { exibirEasterEgg } from "./easteregg.js";

type Contexto = { usuario: string; papel: string };

function executarAcao(ctx: Contexto, acao: Acao, handler: () => void): void {
  if (sessaoExpirada()) throw new SessaoExpiradaError();
  registrarAtividade();

  if (!temPermissao(ctx.papel, acao)) {
    logger.erro(`Acesso negado. Seu papel '${ctx.papel}' não tem permissão para a ação '${acao}'.`);
    return;
  }

  comTratamento(handler);
}

// --- SUBMENU ORGANIZAÇÕES ---
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

    switch (op) {
      case "1": {
        const nome = await perguntar("Nome da organização: ");
        const cnpj = await perguntar("CNPJ (ex: 11.222.333/0001-81): ");
        console.log(`Tipos válidos: ${TIPOS_ORGANIZACAO_VALIDOS.join(" | ")}`);
        const tipo = await perguntar("Tipo: ");
        executarAcao(ctx, "cadastrar_organizacao", () =>
          executarOrganizacoes("criar", { nome, cnpj, tipo }, ctx)
        );
        break;
      }
      case "2": {
        executarAcao(ctx, "consultar_cadastros", () =>
          executarOrganizacoes("listar", {}, ctx)
        );
        break;
      }
      case "3": {
        const id = await perguntar("ID da Organização: ");
        executarAcao(ctx, "consultar_cadastros", () =>
          executarOrganizacoes("consultar", { id }, ctx)
        );
        break;
      }
      case "4": {
        const id = await perguntar("ID da Organização a atualizar: ");
        const nome = await perguntar("Novo Nome (ENTER para manter): ");
        const cnpj = await perguntar("Novo CNPJ (ENTER para manter): ");
        console.log(`Tipos válidos: ${TIPOS_ORGANIZACAO_VALIDOS.join(" | ")}`);
        const tipo = await perguntar("Novo Tipo (ENTER para manter): ");

        const opts: Record<string, string> = { id };
        if (nome.trim()) opts.nome = nome.trim();
        if (cnpj.trim()) opts.cnpj = cnpj.trim();
        if (tipo.trim()) opts.tipo = tipo.trim();

        executarAcao(ctx, "cadastrar_organizacao", () =>
          executarOrganizacoes("atualizar", opts, ctx)
        );
        break;
      }
      case "5": {
        const id = await perguntar("ID da Organização a remover: ");
        executarAcao(ctx, "cadastrar_organizacao", () =>
          executarOrganizacoes("remover", { id }, ctx)
        );
        break;
      }
      default:
        logger.erro("Opção inválida.");
    }
  }
}

// --- SUBMENU LOTES ---
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

    switch (op) {
      case "1": {
        const org = await perguntar("ID da Organização de origem: ");
        const nf = await perguntar("Número da Nota Fiscal: ");
        const transp = await perguntar("Nome da transportadora: ");
        const data = await perguntar("Data do Lote (AAAA-MM-DD, ENTER para hoje): ");

        const opts: Record<string, string> = { org, nf, transp };
        if (data.trim()) opts.data = data.trim();
        executarAcao(ctx, "registrar_lote", () =>
          executarLotes("criar", opts, ctx)
        );
        break;
      }
      case "2": {
        executarAcao(ctx, "consultar_cadastros", () =>
          executarLotes("listar", {}, ctx)
        );
        break;
      }
      case "3": {
        const id = await perguntar("ID do Lote: ");
        executarAcao(ctx, "consultar_cadastros", () =>
          executarLotes("consultar", { id }, ctx)
        );
        break;
      }
      case "4": {
        const id = await perguntar("ID do Lote a atualizar: ");
        const nf = await perguntar("Nova Nota Fiscal (ENTER para manter): ");
        const transp = await perguntar("Nova Transportadora (ENTER para manter): ");
        const data = await perguntar("Nova Data (ENTER para manter): ");

        const opts: Record<string, string> = { id };
        if (nf.trim()) opts.nf = nf.trim();
        if (transp.trim()) opts.transp = transp.trim();
        if (data.trim()) opts.data = data.trim();

        executarAcao(ctx, "registrar_lote", () =>
          executarLotes("atualizar", opts, ctx)
        );
        break;
      }
      case "5": {
        const id = await perguntar("ID do Lote a remover: ");
        executarAcao(ctx, "registrar_lote", () =>
          executarLotes("remover", { id }, ctx)
        );
        break;
      }
      default:
        logger.erro("Opção inválida.");
    }
  }
}

// --- SUBMENU EQUIPAMENTOS ---
async function submenuEquipamentos(ctx: Contexto): Promise<void> {
  while (true) {
    console.log("\n--- GERENCIAR EQUIPAMENTOS ---");
    console.log("1. Cadastrar Equipamento");
    console.log("2. Listar Equipamentos");
    console.log("3. Consultar Rastreabilidade");
    console.log("4. Triar Equipamento");
    console.log("5. Mover para Desmonte");
    console.log("6. Alterar Estado Físico");
    console.log("0. Voltar");

    const op = (await perguntar("Escolha uma opção: ")).trim();
    if (op === "0") break;

    switch (op) {
      case "1": {
        const id = await perguntar("ID/Código do Equipamento: ");
        const lote = await perguntar("ID do Lote: ");
        const tipo = await perguntar("Tipo (ex: notebook, pc, monitor): ");
        const modelo = await perguntar("Modelo: ");
        console.log(`Estados físicos válidos: ${ESTADOS_FISICOS_VALIDOS.join(" | ")}`);
        const estado = await perguntar("Estado físico: ");
        executarAcao(ctx, "cadastrar_equipamento", () =>
          executarEquipamentos("criar", { id, lote, tipo, modelo, estado }, ctx)
        );
        break;
      }
      case "2": {
        executarAcao(ctx, "consultar_cadastros", () =>
          executarEquipamentos("listar", {}, ctx)
        );
        break;
      }
      case "3": {
        const id = await perguntar("ID do Equipamento: ");
        executarAcao(ctx, "rastrear_equipamento", () =>
          executarRelatorios("rastrear", { id })
        );
        break;
      }
      case "4": {
        const id = await perguntar("ID do Equipamento para triar: ");
        executarAcao(ctx, "concluir_triagem", () =>
          executarEquipamentos("triar", { id }, ctx)
        );
        break;
      }
      case "5": {
        const id = await perguntar("ID do Equipamento para desmonte: ");
        executarAcao(ctx, "mover_desmonte", () =>
          executarEquipamentos("desmonte", { id }, ctx)
        );
        break;
      }
      case "6": {
        const id = await perguntar("ID do Equipamento: ");
        console.log(`Novos estados válidos: ${ESTADOS_FISICOS_VALIDOS.join(" | ")}`);
        const novo = await perguntar("Novo Estado Físico: ");
        const justificativa = await perguntar("Justificativa: ");
        executarAcao(ctx, "alterar_estado", () =>
          executarEquipamentos("estado", { id, novo, justificativa }, ctx)
        );
        break;
      }
      default:
        logger.erro("Opção inválida.");
    }
  }
}

// --- SUBMENU CONTRATOS ---
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

    switch (op) {
      case "1": {
        const org = await perguntar("ID da Organização: ");
        const inicio = await perguntar("Data Início (AAAA-MM-DD): ");
        const fim = await perguntar("Data Fim (AAAA-MM-DD): ");
        const termos = await perguntar("Termos (ENTER para padrão): ");
        const opts: Record<string, string> = { org, inicio, fim };
        if (termos.trim()) opts.termos = termos.trim();
        executarAcao(ctx, "cadastrar_contrato", () =>
          executarContratos("criar", opts, ctx)
        );
        break;
      }
      case "2": {
        executarAcao(ctx, "consultar_cadastros", () =>
          executarContratos("listar", {}, ctx)
        );
        break;
      }
      case "3": {
        const id = await perguntar("ID do Contrato: ");
        executarAcao(ctx, "consultar_cadastros", () =>
          executarContratos("consultar", { id }, ctx)
        );
        break;
      }
      case "4": {
        const id = await perguntar("ID do Contrato a atualizar: ");
        const inicio = await perguntar("Nova Data Início (ENTER para manter): ");
        const fim = await perguntar("Nova Data Fim (ENTER para manter): ");
        const termos = await perguntar("Novos Termos (ENTER para manter): ");

        const opts: Record<string, string> = { id };
        if (inicio.trim()) opts.inicio = inicio.trim();
        if (fim.trim()) opts.fim = fim.trim();
        if (termos.trim()) opts.termos = termos.trim();

        executarAcao(ctx, "cadastrar_contrato", () =>
          executarContratos("atualizar", opts, ctx)
        );
        break;
      }
      case "5": {
        const id = await perguntar("ID do Contrato a remover: ");
        executarAcao(ctx, "cadastrar_contrato", () =>
          executarContratos("remover", { id }, ctx)
        );
        break;
      }
      default:
        logger.erro("Opção inválida.");
    }
  }
}

// --- SUBMENU USUÁRIOS ---
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

    switch (op) {
      case "1": {
        const usuario = await perguntar("Nome do Usuário: ");
        const senha = await perguntarSenha("Senha (mín. 8 caracteres): ");
        const papel = await perguntar("Papel (operador_cadastro | gestor_almoxarifado | auditor): ");
        executarAcao(ctx, "gerenciar_usuarios", () =>
          executarUsuarios("criar", { usuario, senha, papel }, ctx)
        );
        break;
      }
      case "2": {
        executarAcao(ctx, "gerenciar_usuarios", () =>
          executarUsuarios("listar", {}, ctx)
        );
        break;
      }
      case "3": {
        const usuario = await perguntar("Nome do Usuário: ");
        executarAcao(ctx, "gerenciar_usuarios", () =>
          executarUsuarios("consultar", { usuario }, ctx)
        );
        break;
      }
      case "4": {
        const usuario = await perguntar("Nome do Usuário a atualizar: ");
        const senha = await perguntarSenha("Nova Senha (ENTER para manter): ");
        const papel = await perguntar("Novo Papel (ENTER para manter): ");
        const opts: Record<string, string> = { usuario };
        if (senha.trim()) opts.senha = senha.trim();
        if (papel.trim()) opts.papel = papel.trim();

        executarAcao(ctx, "gerenciar_usuarios", () =>
          executarUsuarios("atualizar", opts, ctx)
        );
        break;
      }
      case "5": {
        const usuario = await perguntar("Nome do Usuário a remover: ");
        executarAcao(ctx, "gerenciar_usuarios", () =>
          executarUsuarios("remover", { usuario }, ctx)
        );
        break;
      }
      default:
        logger.erro("Opção inválida.");
    }
  }
}

// --- SUBMENU PARÂMETROS E HISTÓRICO ---
async function submenuSistema(ctx: Contexto): Promise<void> {
  while (true) {
    console.log("\n--- SISTEMA E PARÂMETROS ---");
    console.log("1. Visualizar Parâmetros Globais");
    console.log("2. Definir Parâmetros Globais");
    console.log("3. Verificar e Exibir Histórico de Auditoria (Journal)");
    console.log("0. Voltar");

    const op = (await perguntar("Escolha uma opção: ")).trim();
    if (op === "0") break;

    switch (op) {
      case "1": {
        executarAcao(ctx, "configurar_parametros", () => visualizarParametros());
        break;
      }
      case "2": {
        const aliquota = await perguntar("Alíquota de Imposto (%): ");
        const depreciacao = await perguntar("Coeficiente de Depreciação (%): ");
        executarAcao(ctx, "configurar_parametros", () =>
          executarParametros({ aliquota, depreciacao }, ctx)
        );
        break;
      }
      case "3": {
        executarAcao(ctx, "consultar_historico", () => verificarEExibirHistorico());
        break;
      }
      default:
        logger.erro("Opção inválida.");
    }
  }
}

// --- MENU PRINCIPAL GUIADO ---
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
        break;
      default:
        logger.erro("Opção inválida.");
    }
  }
}