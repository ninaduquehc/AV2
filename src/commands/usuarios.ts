import {
  adicionarCredencial,
  atualizarCredencial,
  buscarCredencial,
  listarCredenciais,
  removerCredencial,
} from "../auth/credenciais";
import { PAPEIS_CRIAVEIS } from "../auth/papeis";
import { RegraDeNegocioError } from "../models/erros";
import { log } from "../utils/logger";
import { registrarTransacao } from "../persistence/journal";

type Contexto = { usuario: string };

function criarUsuario(opcoes: Record<string, string>, ctx: Contexto): void {
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

function listarUsuarios(): void {
  const usuarios = listarCredenciais();

  if (usuarios.length === 0) {
    log.info("Nenhum usuário cadastrado.");
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
    log.erro("Uso: usuario consultar --usuario <NOME>");
    return;
  }

  const u = buscarCredencial(nome);
  if (!u) {
    log.erro(`Usuário '${nome}' não encontrado.`);
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
    log.erro("Uso: usuario atualizar --usuario <NOME> [--senha <NOVA_SENHA>] [--papel <PAPEL>]");
    return;
  }
  if (!senha && !papel) {
    log.erro("Informe ao menos um campo para atualizar (--senha ou --papel).");
    return;
  }

  const alvo = buscarCredencial(nome);
  if (!alvo) {
    log.erro(`Usuário '${nome}' não encontrado.`);
    return;
  }

  if (papel) {
    if (!PAPEIS_CRIAVEIS.includes(papel)) {
      log.erro(`Papel inválido. Opções válidas: ${PAPEIS_CRIAVEIS.join(", ")}`);
      return;
    }
    if (alvo.papel === "administrador") {
      throw new RegraDeNegocioError("O papel de um administrador não pode ser alterado.");
    }
  }

  if (senha && senha.length < 8) {
    log.erro("A senha deve possuir pelo menos 8 caracteres.");
    return;
  }

  atualizarCredencial(nome, { senha, papel });

  // A senha nunca vai para o journal: só registramos quais campos mudaram.
  const campos = [senha && "senha", papel && "papel"].filter(Boolean);
  registrarTransacao(ctx.usuario, "atualizar_usuario", { usuarioAlvo: nome, campos });
  log.sucesso(`Usuário '${nome}' atualizado com sucesso.`);
}

function removerUsuario(opcoes: Record<string, string>, ctx: Contexto): void {
  const nome = opcoes["usuario"]?.trim();
  if (!nome) {
    log.erro("Uso: usuario remover --usuario <NOME>");
    return;
  }

  const alvo = buscarCredencial(nome);
  if (!alvo) {
    log.erro(`Usuário '${nome}' não encontrado.`);
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
  log.sucesso(`Usuário '${nome}' removido com sucesso.`);
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
      log.erro("Ação inválida. Use: usuario criar | listar | consultar | atualizar | remover.");
  }
}
