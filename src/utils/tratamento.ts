import { RegraDeNegocioError } from "../models/erros.js";
import { OperacaoCanceladaError } from "../cli/entrada.js";
import { logger } from "./logger.js";

// Regras de negócio ou cancelamento viram mensagem de erro/aviso; falhas inesperadas sobem.
export function comTratamento(operacao: () => void): void {
  try {
    operacao();
  } catch (erro) {
    if (erro instanceof RegraDeNegocioError) {
      logger.erro(erro.message);
    } else if (erro instanceof OperacaoCanceladaError) {
      logger.aviso("Operação cancelada pelo usuário.");
    } else {
      throw erro;
    }
  }
}