import { estaProvisionado, provisionar } from "./config/provisionamento.js";
import { autenticar } from "./auth/login.js";
import { registrarAtividade } from "./auth/sessao.js";
import { logger } from "./utils/logger.js";
import { menuGuiado } from "./cli/guiado.js";
import {
  rl,
  perguntar,
  perguntarSenha,
  SessaoExpiradaError,
} from "./cli/entrada.js";

async function principal() {
  try {
    if (!estaProvisionado()) {
      logger.info("Nenhuma configuração encontrada. Iniciando provisionamento...");
      let senhaAdmin = "";
      while (senhaAdmin.length < 8) {
        senhaAdmin = await perguntarSenha("Defina a senha do administrador (mín. 8 caracteres): ");
      }
      provisionar(senhaAdmin);
    } else {
      logger.info("Sistema configurado. Prosseguindo para login...");
    }

    const usuario = await perguntar("Usuário: ");
    const senha = await perguntarSenha("Senha: ");
    const resultado = autenticar(usuario, senha);

    if (resultado.autenticado && resultado.papel) {
      logger.sucesso("Login realizado com sucesso.");
      registrarAtividade();

      // Entra direto no menu guiado
      await menuGuiado({ usuario: usuario.trim(), papel: resultado.papel });

      logger.info("Sessão encerrada.");
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