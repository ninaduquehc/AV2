import { adicionarCredencial } from "../auth/credenciais";
import { PAPEIS_CRIAVEIS } from "../auth/papeis";
import { log } from "../utils/logger";
import { registrarTransacao } from "../persistence/journal";

export function executarUsuarios(opcoes: Record<string, string>, ctx: { usuario: string }): void {
  const usuarioNovo = opcoes["usuario"];
  const senha = opcoes["senha"];
  const papel = opcoes["papel"];

  if (!usuarioNovo || !senha || !papel) {
    log.erro("Uso: usuario criar --usuario <NOME> --senha <SENHA> --papel <PAPEL>");
    return;
  }

  if (!PAPEIS_CRIAVEIS.includes(papel)) {
    log.erro(`Papel inválido. Opções válidas: ${PAPEIS_CRIAVEIS.join(", ")}`);
    return;
  }

  if (senha.length < 8) {
    log.erro("A senha deve possuir pelo menos 8 caracteres.");
    return;
  }

  const sucesso = adicionarCredencial(usuarioNovo, senha, papel);
  if (sucesso) {
    registrarTransacao(ctx.usuario, "criar_usuario", { usuarioNovo, papel });
    log.sucesso(`Usuário '${usuarioNovo}' cadastrado com sucesso com papel '${papel}'.`);
  } else {
    log.erro("Usuário já existente no sistema.");
  }
}