import { Acao, temPermissao } from "../auth/permissoes";

export interface ItemMenu {
  opcao: string;
  rotulo: string;
  acao: Acao;
}

export const ITENS_MENU: ItemMenu[] = [
  { opcao: "1", rotulo: "Gerenciar usuários", acao: "gerenciar_usuarios" },
  { opcao: "2", rotulo: "Configurar parâmetros globais", acao: "configurar_parametros" },
  { opcao: "3", rotulo: "Cadastrar organização", acao: "cadastrar_organizacao" },
  { opcao: "4", rotulo: "Registrar lote", acao: "registrar_lote" },
  { opcao: "5", rotulo: "Consultar histórico", acao: "consultar_historico" },
  { opcao: "6", rotulo: "Cadastrar equipamento", acao: "cadastrar_equipamento" },
  { opcao: "7", rotulo: "Concluir triagem de equipamento", acao: "concluir_triagem" },
  { opcao: "8", rotulo: "Mover equipamento para desmonte", acao: "mover_desmonte" },
  { opcao: "9", rotulo: "Cadastrar contrato de coleta", acao: "cadastrar_contrato" },
  { opcao: "10", rotulo: "Alterar estado físico de equipamento", acao: "alterar_estado" },
  { opcao: "11", rotulo: "Rastrear equipamento", acao: "rastrear_equipamento" },
  { opcao: "12", rotulo: "Relatório resumo", acao: "gerar_relatorio" },
];

// Só devolve o item se o papel tiver permissão (opções ocultas também não executam).
export function obterItemMenu(papel: string, escolha: string): ItemMenu | undefined {
  return ITENS_MENU.find((i) => i.opcao === escolha.trim() && temPermissao(papel, i.acao));
}

export function exibirMenu(papel: string): void {
  console.log("\n--- Menu ---");
  ITENS_MENU.filter((i) => temPermissao(papel, i.acao)).forEach((i) => {
    console.log(`${i.opcao}. ${i.rotulo}`);
  });
  console.log("0. Voltar ao modo comando");
}