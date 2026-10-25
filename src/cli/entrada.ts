import * as readline from "readline";
import { Writable } from "stream";

export class SessaoExpiradaError extends Error {
  constructor() {
    super("Sessão expirada por inatividade.");
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