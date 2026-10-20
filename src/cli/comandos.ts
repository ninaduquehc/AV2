import { temPermissao, Acao } from "../auth/permissoes";
import { parseLinhaComando } from "./parser";
import { log } from "../utils/logger";
import { comTratamento } from "../utils/tratamento";
import { menuGuiadoExemplo } from "./guiado";
import { exibirEasterEgg } from "./easteregg";

import { executarUsuarios } from "../commands/usuarios";
import { executarOrganizacoes } from "../commands/organizacoes";
import { executarContratos } from "../commands/contratos";
import { executarLotes } from "../commands/lotes";
import { executarEquipamentos } from "../commands/equipamentos";
import { executarRelatorios } from "../commands/relatorios";
import { executarParametros, visualizarParametros } from "../commands/parametros";
import { verificarEExibirHistorico } from "../commands/historico";

export async function executarLinha(linha: string, ctx: { usuario: string; papel: string }): Promise<void> {
  const parsed = parseLinhaComando(linha);

  if (parsed.acaoPrincipal === "wall-e") {
    exibirEasterEgg();
    return;
  }

  if (parsed.acaoPrincipal === "ajuda") {
    console.log("\nComandos disponíveis:");
    console.log("- usuario criar --usuario <NOME> --senha <SENHA> --papel <PAPEL>");
    console.log("- parametro ver");
    console.log("- parametro definir --aliquota <NUMERO> --depreciacao <NUMERO>");
    console.log("- organizacao criar --nome <NOME> --cnpj <CNPJ> --tipo <TIPO>");
    console.log("- contrato criar --org <ORG_ID> --inicio <AAAA-MM-DD> --fim <AAAA-MM-DD>");
    console.log("- lote criar --org <ORG_ID> --nf <NF> --transp <TRANSP>");
    console.log("- equipamento criar --lote <LOTE> --tipo <TIPO> --modelo <MOD> [--id COD] [--estado ESTADO]");
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

  const mapaAcoes: Record<string, { acao: Acao; handler: () => void }> = {
    usuario: {
      acao: "gerenciar_usuarios",
      handler: () => executarUsuarios(parsed.opcoes, ctx),
    },
    parametro: {
      acao: "configurar_parametros",
      handler: () => {
        if (parsed.subAcao === "ver") visualizarParametros();
        else executarParametros(parsed.opcoes, ctx);
      },
    },
    organizacao: {
      acao: "cadastrar_organizacao",
      handler: () => executarOrganizacoes(parsed.opcoes, ctx),
    },
    contrato: {
      acao: "cadastrar_contrato",
      handler: () => executarContratos(parsed.opcoes, ctx),
    },
    lote: {
      acao: "registrar_lote",
      handler: () => executarLotes(parsed.opcoes, ctx),
    },
    equipamento: {
      acao: "cadastrar_equipamento",
      handler: () => executarEquipamentos(parsed.subAcao || "criar", parsed.opcoes, ctx),
    },
    historico: {
      acao: "consultar_historico",
      handler: () => verificarEExibirHistorico(),
    },
    relatorio: {
      acao: "gerar_relatorio",
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