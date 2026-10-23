import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DIR_DATA = process.env.DATA_DIR 
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "..", "..", "data");

export const ARQ_CONFIG = path.join(DIR_DATA, "config.json");
export const ARQ_USUARIOS = path.join(DIR_DATA, "usuarios.json");
export const ARQ_CREDENCIAIS = path.join(DIR_DATA, "credenciais.json");
export const ARQ_ORGANIZACOES = path.join(DIR_DATA, "organizacoes.json");
export const ARQ_LOTES = path.join(DIR_DATA, "lotes.json");
export const ARQ_EQUIPAMENTOS = path.join(DIR_DATA, "equipamentos.json");
export const ARQ_MOVIMENTACOES = path.join(DIR_DATA, "movimentacoes.json");
export const ARQ_PARAMETROS = path.join(DIR_DATA, "parametros.json");
export const ARQ_CONTRATOS = path.join(DIR_DATA, "contratos.json");
export const ARQ_JOURNAL = path.join(DIR_DATA, "journal.log");