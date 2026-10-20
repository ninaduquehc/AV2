export type Acao =
  | "gerenciar_usuarios"
  | "configurar_parametros"
  | "cadastrar_organizacao"
  | "cadastrar_contrato"
  | "registrar_lote"
  | "cadastrar_equipamento"
  | "concluir_triagem"
  | "mover_desmonte"
  | "alterar_estado"
  | "consultar_historico"
  | "rastrear_equipamento"
  | "gerar_relatorio";

const PERMISSOES: Record<Acao, string[]> = {
  gerenciar_usuarios: ["administrador"],
  configurar_parametros: ["administrador"],
  cadastrar_organizacao: ["operador_cadastro", "administrador"],
  cadastrar_contrato: ["operador_cadastro", "administrador"],
  registrar_lote: ["gestor_almoxarifado", "administrador"],
  cadastrar_equipamento: ["gestor_almoxarifado", "administrador"],
  concluir_triagem: ["gestor_almoxarifado", "administrador"],
  mover_desmonte: ["gestor_almoxarifado", "administrador"],
  alterar_estado: ["gestor_almoxarifado", "administrador"],
  consultar_historico: ["auditor", "administrador"],
  rastrear_equipamento: ["auditor", "administrador"],
  gerar_relatorio: ["auditor", "administrador"],
};

export function temPermissao(papel: string, acao: Acao): boolean {
  return PERMISSOES[acao].includes(papel);
}