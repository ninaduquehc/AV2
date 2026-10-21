import { temPermissao } from '../auth/permissoes.js';
import { parseLinhaComando } from './parser.js';
import { logger as log } from '../utils/logger.js';
import { comTratamento } from '../utils/tratamento.js';
import { menuGuiadoExemplo } from './guiado.js';
import { exibirEasterEgg } from './easteregg.js';

import { Acao } from '../auth/permissoes.js';

import { executarUsuarios } from '../commands/usuarios.js';
import { executarOrganizacoes } from '../commands/organizacoes.js';
import { executarContratos } from '../commands/contratos.js';
import { executarLotes } from '../commands/lotes.js';
import { executarEquipamentos } from '../commands/equipamentos.js';
import { executarRelatorios } from '../commands/relatorios.js';
import { visualizarParametros, executarParametros } from '../commands/parametros.js';
import { verificarEExibirHistorico } from '../commands/historico.js';

export async function executarLinha(linha: string, ctx: { usuario: string; papel: string }): Promise<void> {
  const parsed = parseLinhaComando(linha);

  if (parsed.acaoPrincipal === "wall-e") {
    exibirEasterEgg();
    return;
  }

  if (parsed.acaoPrincipal === "ajuda") {
    console.log("\nComandos disponíveis:");
    console.log("- usuario criar --usuario <NOME> --senha <SENHA> --papel <PAPEL>");
    console.log("- usuario listar | consultar --usuario <NOME>");
    console.log("- usuario atualizar --usuario <NOME> [--senha <SENHA>] [--papel <PAPEL>]");
    console.log("- usuario remover --usuario <NOME>");
    console.log("- parametro ver");
    console.log("- parametro definir --aliquota <NUMERO> --depreciacao <NUMERO>");
    console.log("- organizacao criar --nome <NOME> --cnpj <CNPJ> --tipo <TIPO>");
    console.log("- organizacao listar | consultar --id <ORG_ID>");
    console.log("- organizacao atualizar --id <ORG_ID> [--nome <NOME>] [--cnpj <CNPJ>] [--tipo <TIPO>]");
    console.log("- organizacao remover --id <ORG_ID>");
    console.log("- contrato criar --org <ORG_ID> --inicio <AAAA-MM-DD> --fim <AAAA-MM-DD> [--termos TEXTO]");
    console.log("- contrato listar [--org <ORG_ID>] | consultar --id <CONTRATO_ID>");
    console.log("- contrato atualizar --id <CONTRATO_ID> [--inicio AAAA-MM-DD] [--fim AAAA-MM-DD] [--termos TEXTO]");
    console.log("- contrato remover --id <CONTRATO_ID>");
    console.log("- lote criar --org <ORG_ID> --nf <NF> --transp <TRANSP> [--data AAAA-MM-DD]");
    console.log("- lote listar [--org <ORG_ID>] | consultar --id <LOTE_ID>");
    console.log("- lote atualizar --id <LOTE_ID> [--nf <NF>] [--transp <TRANSP>] [--data AAAA-MM-DD]");
    console.log("- lote remover --id <LOTE_ID>");
    console.log("- equipamento criar --lote <LOTE> --tipo <TIPO> --modelo <MOD> [--id COD] [--estado ESTADO]");
    console.log("- equipamento listar [--lote <LOTE>] [--status <STATUS>] | consultar --id <COD>");
    console.log("- equipamento atualizar --id <COD> [--tipo <TIPO>] [--modelo <MOD>]");
    console.log("- equipamento remover --id <COD>");
    console.log("- equipamento triar --id <COD>");
    console.log("- equipamento desmonte --id <COD>");
    console.log("- equipamento estado --id <COD> --novo <ESTADO> [--justificativa TEXTO]");
    console.log("- historico");
    console.log("- relatorio journal");
    console.log("- relatorio rastrear --id <COD>");
    return;
  }

  if (parsed.acaoPrincipal === "menu") {
    await menuGuiadoExemplo();
    return;
  }

  // Leitura e escrita com permissões diferentes.
  const leitura =
    parsed.subAcao === "listar" || parsed.subAcao === "consultar";

  const acaoEquipamento: Acao =
    leitura
      ? "consultar_cadastros"
      : parsed.subAcao === "triar"
        ? "concluir_triagem"
        : parsed.subAcao === "desmonte"
          ? "mover_desmonte"
          : parsed.subAcao === "estado"
            ? "alterar_estado"
            : "cadastrar_equipamento";

  const acaoRelatorio: Acao =
    parsed.subAcao === "rastrear"
      ? "rastrear_equipamento"
      : "consultar_historico";

  const mapaAcoes: Record<string, { acao: Acao; handler: () => void }> = {
    usuario: {
      acao: "gerenciar_usuarios",
      handler: () => executarUsuarios(parsed.subAcao || "criar", parsed.opcoes, ctx),
    },
    parametro: {
      acao: "configurar_parametros",
      handler: () => {
        if (parsed.subAcao === "ver") visualizarParametros();
        else executarParametros(parsed.opcoes, ctx);
      },
    },
    organizacao: {
      acao:
        parsed.subAcao === "listar" || parsed.subAcao === "consultar"
          ? "consultar_cadastros"
          : "cadastrar_organizacao",
      handler: () =>
        executarOrganizacoes(parsed.subAcao || "", parsed.opcoes, ctx),
    },
    contrato: {
      acao: leitura ? "consultar_cadastros" : "cadastrar_contrato",
      handler: () => executarContratos(parsed.subAcao || "criar", parsed.opcoes, ctx),
    },
    lote: {
      acao: leitura ? "consultar_cadastros" : "registrar_lote",
      handler: () => executarLotes(parsed.subAcao || "criar", parsed.opcoes, ctx),
    },

    equipamento: {
      acao: leitura
        ? "consultar_cadastros"
        : parsed.subAcao === "triar"
          ? "concluir_triagem"
          : parsed.subAcao === "desmonte"
            ? "mover_desmonte"
            : parsed.subAcao === "estado"
              ? "alterar_estado"
              : "cadastrar_equipamento",
      handler: () =>
        executarEquipamentos(parsed.subAcao || "criar", parsed.opcoes, ctx),
    },

    historico: {
      acao: "consultar_historico",
      handler: () => verificarEExibirHistorico(),
    },
    relatorio: {
      acao: acaoRelatorio,
      handler: () => executarRelatorios(parsed.subAcao, parsed.opcoes),
    },
  };

  const item = mapaAcoes[parsed.acaoPrincipal];
  if (!item) {
    log.erro(`Comando '${parsed.acaoPrincipal}' não reconhecido. Digite "ajuda".`);
    return;
  }

  if (!temPermissao(ctx.papel, item.acao)) {
    log.erro(`Acesso negado. Seu papel '${ctx.papel}' não possui permissão para esta operação.`);
    return;
  }

  comTratamento(() => item.handler());
}