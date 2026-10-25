import * as readline from "readline";
import { Writable } from "stream";

export class SessaoExpiradaError extends Error {
  constructor() {
    super("Sessão expirada por inatividade.");
  }
}

export class OperacaoCanceladaError extends Error {
  constructor() {
    super("Operação cancelada pelo usuário.");
  }
}

let mudo = false;

// Escreve normalmente, exceto quando uma senha está sendo digitada.
const saida = new Writable({
  write(chunk, encoding, callback) {
    if (!mudo) process.stdout.write(chunk, encoding);
    callback();
  },
});

export const rl = readline.createInterface({
  input: process.stdin,
  output: saida,
  terminal: true,
});

rl.on("SIGINT", () => {
  console.log("\nEncerrando.");
  process.exit(0);
});

export function perguntar(promptTexto: string): Promise<string> {
  return new Promise((resolve) => rl.question(promptTexto, resolve));
}

// Mostra o prompt, mas não exibe o que é digitado.
export function perguntarSenha(promptTexto: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(promptTexto);
    mudo = true;
    rl.question("", (resposta) => {
      mudo = false;
      process.stdout.write("\n");
      resolve(resposta);
    });
  });
}

// Aguarda confirmação do usuário antes de voltar ao menu principal/submenu
export async function aguardarMenu(): Promise<void> {
  await perguntar("\nPressione ENTER para voltar ao menu...");
}

// Pergunta repetidamente até passar na validação ou o usuário cancelar (0 ou 'cancelar')
export async function perguntarComValidacao(
  promptTexto: string,
  validador: (valor: string) => boolean | string
): Promise<string> {
  while (true) {
    const resposta = (await perguntar(promptTexto)).trim();

    // Rota de saída universal
    if (
      resposta === "0" ||
      resposta.toLowerCase() === "cancelar" ||
      resposta.toLowerCase() === "voltar"
    ) {
      throw new OperacaoCanceladaError();
    }

    const resultado = validador(resposta);

    if (resultado === true) {
      return resposta;
    }

    if (typeof resultado === "string") {
      console.log(`[ERRO] ${resultado}`);
    } else {
      console.log("[ERRO] Valor inválido. Tente novamente.");
    }
  }
}

// Senha com validação; digitar 0 cancela
export async function perguntarSenhaComValidacao(
  promptTexto: string,
  validador: (valor: string) => boolean | string
): Promise<string> {
  while (true) {
    const resposta = await perguntarSenha(promptTexto);

    if (resposta === "0") throw new OperacaoCanceladaError();

    const resultado = validador(resposta);
    if (resultado === true) return resposta;

    console.log(`[ERRO] ${typeof resultado === "string" ? resultado : "Valor inválido. Tente novamente."}`);
  }
}