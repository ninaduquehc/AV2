import { estaProvisionado, provisionar } from "./config/provisionamento.js";
import { autenticar } from "./auth/login.js";
import { registrarAtividade } from "./auth/sessao.js";
import {
  rl,
  perguntar,
  lerComando,
  definirCompletador,
  SessaoExpiradaError,
} from "./cli/entrada.js";
import { executarLinha } from "./cli/comandos.js";
import { criarCompletador } from "./cli/completar.js";
import { logger } from "./utils/logger.js";

async function loopComandos(papel: string, usuario: string): Promise<void> {
  definirCompletador(criarCompletador(papel));
  logger.info('Modo comando. Digite "ajuda" para listar os comandos ou "menu" para o modo guiado.');

  while (true) {
    const linha = (await lerComando(`greencode (${usuario})> `)).trim();
    if (linha === "") continue;

    if (["sair", "exit"].includes(linha.toLowerCase())) {
      logger.info("Encerrando sessão.");
      break;
    }

    try {
      await executarLinha(linha, { usuario, papel });
    } catch (erro) {
      if (erro instanceof SessaoExpiradaError) throw erro;
      logger.erro((erro as Error).message);
    }
  }
}

async function principal() {
  try {
    if (!estaProvisionado()) {
      logger.info("Nenhuma configuração encontrada. Iniciando provisionamento...");
      let senhaAdmin = "";
      while (senhaAdmin.length < 8) {
        senhaAdmin = await perguntar("Defina a senha do administrador (mín. 8 caracteres): ");
      }
      provisionar(senhaAdmin);
    } else {
      logger.info("Sistema configurado. Prosseguindo para login...");
    }

    const usuario = await perguntar("Usuário: ");
    const senha = await perguntar("Senha: ");
    const resultado = autenticar(usuario, senha);

    if (resultado.autenticado && resultado.papel) {
      logger.sucesso("Login realizado com sucesso.");
      registrarAtividade();
      await loopComandos(resultado.papel, usuario.trim());
    } else {
      logger.erro("Usuário ou senha inválidos.");
    }
  } catch (erro) {
    if (erro instanceof SessaoExpiradaError) {
      logger.aviso("Sessão expirada por inatividade. Faça login novamente.");
    } else {
      logger.erro((erro as Error).message);
    }
  }

  rl.close();
}

principal();