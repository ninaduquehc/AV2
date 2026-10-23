import {
  adicionarCredencial,
  atualizarCredencial,
  buscarCredencial,
  listarCredenciais,
  removerCredencial,
} from "../auth/credenciais.js";
import { PAPEIS_CRIAVEIS } from "../auth/papeis.js";
import { RegraDeNegocioError } from "../models/erros.js";
import { logger } from "../utils/logger.js";
import { registrarTransacao } from "../persistence/journal.js";

type Contexto = { usuario: string };

function criarUsuario(opcoes: Record<string, string>, ctx: Contexto): void {
  const usuarioNovo = opcoes["usuario"];
  const senha = opcoes["senha"];
  const papel = opcoes["papel"];

  if (!usuarioNovo || !senha || !papel) {
    logger.erro("Uso: usuario criar --usuario <NOME> --senha <SENHA> --papel <PAPEL>");
    return;
  }

  if (!PAPEIS_CRIAVEIS.includes(papel)) {
    logger.erro(`Papel inválido. Opções válidas: ${PAPEIS_CRIAVEIS.join(", ")}`);
    return;
  }

  if (senha.length < 8) {
    logger.erro("A senha deve possuir pelo menos 8 caracteres.");
    return;
  }

  const sucesso = adicionarCredencial(usuarioNovo, senha, papel);
  if (sucesso) {
    registrarTransacao(ctx.usuario, "criar_usuario", { usuarioNovo, papel });
    logger.sucesso(`Usuário '${usuarioNovo}' cadastrado com sucesso com papel '${papel}'.`);
  } else {
    logger.erro("Usuário já existente no sistema.");
  }
}

function listarUsuarios(): void {
  const usuarios = listarCredenciais();

  if (usuarios.length === 0) {
    logger.info("Nenhum usuário cadastrado.");
    return;
  }

  console.log("\n--- Usuários ---");
  for (const u of usuarios) {
    console.log(`Usuário: ${u.usuario} | Papel: ${u.papel}`);
  }
}

function consultarUsuario(opcoes: Record<string, string>): void {
  const nome = opcoes["usuario"]?.trim();
  if (!nome) {
    logger.erro("Uso: usuario consultar --usuario <NOME>");
    return;
  }

  const u = buscarCredencial(nome);
  if (!u) {
    logger.erro(`Usuário '${nome}' não encontrado.`);
    return;
  }

  console.log("\n--- Detalhes do usuário ---");
  console.log(`Usuário: ${u.usuario}`);
  console.log(`Papel: ${u.papel}`);
}

function atualizarUsuario(opcoes: Record<string, string>, ctx: Contexto): void {
  const nome = opcoes["usuario"]?.trim();
  const senha = opcoes["senha"];
  const papel = opcoes["papel"];

  if (!nome) {
    logger.erro("Uso: usuario atualizar --usuario <NOME> [--senha <NOVA_SENHA>] [--papel <PAPEL>]");
    return;
  }
  if (!senha && !papel) {
    logger.erro("Informe ao menos um campo para atualizar (--senha ou --papel).");
    return;
  }

  const alvo = buscarCredencial(nome);
  if (!alvo) {
    logger.erro(`Usuário '${nome}' não encontrado.`);
    return;
  }

  if (papel) {
    if (!PAPEIS_CRIAVEIS.includes(papel)) {
      logger.erro(`Papel inválido. Opções válidas: ${PAPEIS_CRIAVEIS.join(", ")}`);
      return;
    }
    if (alvo.papel === "administrador") {
      throw new RegraDeNegocioError("O papel de um administrador não pode ser alterado.");
    }
  }

  if (senha && senha.length < 8) {
    logger.erro("A senha deve possuir pelo menos 8 caracteres.");
    return;
  }

  atualizarCredencial(nome, { senha, papel });

  // A senha nunca vai para o journal: só registramos quais campos mudaram.
  const campos = [senha && "senha", papel && "papel"].filter(Boolean);
  registrarTransacao(ctx.usuario, "atualizar_usuario", { usuarioAlvo: nome, campos });
  logger.sucesso(`Usuário '${nome}' atualizado com sucesso.`);
}

function removerUsuario(opcoes: Record<string, string>, ctx: Contexto): void {
  const nome = opcoes["usuario"]?.trim();
  if (!nome) {
    logger.erro("Uso: usuario remover --usuario <NOME>");
    return;
  }

  const alvo = buscarCredencial(nome);
  if (!alvo) {
    logger.erro(`Usuário '${nome}' não encontrado.`);
    return;
  }

  if (alvo.papel === "administrador") {
    throw new RegraDeNegocioError("Usuários com papel de administrador não podem ser removidos.");
  }
  if (nome === ctx.usuario) {
    throw new RegraDeNegocioError("Você não pode remover o próprio usuário.");
  }

  removerCredencial(nome);

  registrarTransacao(ctx.usuario, "remover_usuario", { usuarioRemovido: nome });
  logger.sucesso(`Usuário '${nome}' removido com sucesso.`);
}

export function executarUsuarios(subAcao: string, opcoes: Record<string, string>, ctx: Contexto): void {
  switch (subAcao) {
    case "criar":
      criarUsuario(opcoes, ctx);
      break;
    case "listar":
      listarUsuarios();
      break;
    case "consultar":
      consultarUsuario(opcoes);
      break;
    case "atualizar":
      atualizarUsuario(opcoes, ctx);
      break;
    case "remover":
      removerUsuario(opcoes, ctx);
      break;
    default:
      logger.erro("Ação inválida. Use: usuario criar | listar | consultar | atualizar | remover.");
  }
}
