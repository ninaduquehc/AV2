import { RegraDeNegocioError } from "../models/erros";
import { log } from "./logger";

// Regras de negócio violadas viram mensagem de erro; falhas inesperadas continuam subindo.
export function comTratamento(operacao: () => void): void {
  try {
    operacao();
  } catch (erro) {
    if (erro instanceof RegraDeNegocioError) {
      log.erro(erro.message);
    } else {
      throw erro;
    }
  }
}