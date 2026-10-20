import { estaProvisionado, provisionar } from "./config/provisionamento";
import { autenticar } from "./auth/login";
import { registrarAtividade } from "./auth/sessao";
import {
  rl,
  perguntar,
  lerComando,
  definirCompletador,
  SessaoExpiradaError,
} from "./cli/entrada";
import { executarLinha } from "./cli/comandos";
import { criarCompletador } from "./cli/completar";
import { log } from "./utils/logger";

async function loopComandos(papel: string, usuario: string): Promise<void> {
  definirCompletador(criarCompletador(papel));
  log.info('Modo comando. Digite "ajuda" para listar os comandos ou "menu" para o modo guiado.');

  while (true) {
    const linha = (await lerComando(`greencode (${usuario})> `)).trim();
    if (linha === "") continue;

    if (["sair", "exit"].includes(linha.toLowerCase())) {
      log.info("Encerrando sessão.");
      break;
    }

    try {
      await executarLinha(linha, { usuario, papel });
    } catch (erro) {
      if (erro instanceof SessaoExpiradaError) throw erro;
      log.erro((erro as Error).message);
    }
  }
}

async function principal() {
  try {
    if (!estaProvisionado()) {
      log.info("Nenhuma configuração encontrada. Iniciando provisionamento...");
      let senhaAdmin = "";
      while (senhaAdmin.length < 8) {
        senhaAdmin = await perguntar("Defina a senha do administrador (mín. 8 caracteres): ");
      }
      provisionar(senhaAdmin);
    } else {
      log.info("Sistema configurado. Prosseguindo para login...");
    }

    const usuario = await perguntar("Usuário: ");
    const senha = await perguntar("Senha: ");
    const resultado = autenticar(usuario, senha);

    if (resultado.autenticado && resultado.papel) {
      log.sucesso("Login realizado com sucesso.");
      registrarAtividade();
      await loopComandos(resultado.papel, usuario.trim());
    } else {
      log.erro("Usuário ou senha inválidos.");
    }
  } catch (erro) {
    if (erro instanceof SessaoExpiradaError) {
      log.aviso("Sessão expirada por inatividade. Faça login novamente.");
    } else {
      log.erro((erro as Error).message);
    }
  }

  rl.close();
}

principal();