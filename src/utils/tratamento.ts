import { RegraDeNegocioError } from "../models/erros.js";
import { logger } from "./logger.js";

// Regras de negócio violadas viram mensagem de erro; falhas inesperadas continuam subindo.
export function comTratamento(operacao: () => void): void {
  try {
    operacao();
  } catch (erro) {
    if (erro instanceof RegraDeNegocioError) {
      logger.erro(erro.message);
    } else {
      throw erro;
    }
  }
}