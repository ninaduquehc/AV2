import { temPermissao, Acao } from "../auth/permissoes";

const COMANDOS_MAPA: Record<string, Acao> = {
  usuario: "gerenciar_usuarios",
  parametro: "configurar_parametros",
  organizacao: "cadastrar_organizacao",
  contrato: "cadastrar_contrato",
  lote: "registrar_lote",
  equipamento: "cadastrar_equipamento",
  triagem: "concluir_triagem",
  desmonte: "mover_desmonte",
  estado: "alterar_estado",
  historico: "consultar_historico",
  rastrear: "rastrear_equipamento",
  relatorio: "gerar_relatorio",
};

export function criarCompletador(papel: string) {
  return (line: string): [string[], string] => {
    const listaDisponivel = Object.entries(COMANDOS_MAPA)
      .filter(([_, acao]) => temPermissao(papel, acao))
      .map(([cmd]) => cmd);

    listaDisponivel.push("ajuda", "menu", "sair");

    const hits = listaDisponivel.filter((c) => c.startsWith(line.trim()));
    return [hits.length ? hits : listaDisponivel, line];
  };
}