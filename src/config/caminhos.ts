import * as caminho from "path";

export const DIR_DATA = caminho.join(__dirname, "..", "..", "data");
export const ARQ_CONFIG = caminho.join(DIR_DATA, "config.json");
export const ARQ_CREDENCIAIS = caminho.join(DIR_DATA, "credenciais.enc");
export const ARQ_ORGANIZACOES = caminho.join(DIR_DATA, "organizacoes.enc");
export const ARQ_CONTRATOS = caminho.join(DIR_DATA, "contratos.enc");
export const ARQ_LOTES = caminho.join(DIR_DATA, "lotes.enc");
export const ARQ_EQUIPAMENTOS = caminho.join(DIR_DATA, "equipamentos.enc");
export const ARQ_MOVIMENTACOES = caminho.join(DIR_DATA, "movimentacoes.enc");
export const ARQ_PARAMETROS = caminho.join(DIR_DATA, "parametros.enc");
export const ARQ_JOURNAL = caminho.join(DIR_DATA, "journal.log");