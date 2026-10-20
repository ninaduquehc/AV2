import * as readline from "readline";
import * as path from "path";
import * as fs from "fs";
import { sessaoExpirada, registrarAtividade } from "../auth/sessao";
import { DIR_DATA } from "../config/caminhos";

const ARQ_HISTORICO = path.join(DIR_DATA, "cli_history.txt");
const LIMITE_HISTORICO = 200;
const PADRAO_SENSIVEL = /--senha\b/i;

export class SessaoExpiradaError extends Error {
  constructor() {
    super("Sessão expirada por inatividade.");
  }
}

function carregarHistorico(): string[] {
  try {
    return fs
      .readFileSync(ARQ_HISTORICO, "utf-8")
      .split("\n")
      .filter((l) => l.trim() !== "");
  } catch {
    return [];
  }
}

let historico: string[] = carregarHistorico(); // do mais antigo ao mais novo
let completadorAtual: (line: string) => [string[], string] = () => [[], ""];

export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  history: [...historico].reverse(), // readline espera o mais recente primeiro
  historySize: LIMITE_HISTORICO,
  removeHistoryDuplicates: true,
  completer: (line: string) => completadorAtual(line),
});

rl.on("SIGINT", () => {
  console.log("\nEncerrando.");
  process.exit(0);
});

export function definirCompletador(fn: (line: string) => [string[], string]): void {
  completadorAtual = fn;
}

function lerLinha(promptTexto: string): Promise<string> {
  return new Promise((resolve) => rl.question(promptTexto, resolve));
}

function removerDoHistoricoEmMemoria(linha: string): void {
  const h = (rl as any).history;
  if (Array.isArray(h) && h[0] === linha) h.shift();
}

// Respostas a perguntas (senha de login, etc.) nunca ficam no histórico.
export async function perguntar(promptTexto: string): Promise<string> {
  const resposta = await lerLinha(promptTexto);
  removerDoHistoricoEmMemoria(resposta);
  return resposta;
}

export async function lerComando(promptTexto: string): Promise<string> {
  const resposta = await lerLinha(promptTexto);

  if (sessaoExpirada()) throw new SessaoExpiradaError();
  registrarAtividade();

  if (PADRAO_SENSIVEL.test(resposta)) {
    removerDoHistoricoEmMemoria(resposta);
  } else {
    salvarHistorico(resposta);
  }
  return resposta;
}

function salvarHistorico(comando: string): void {
  const limpo = comando.trim();
  if (!limpo) return;

  historico = historico.filter((l) => l !== limpo);
  historico.push(limpo);
  historico = historico.slice(-LIMITE_HISTORICO);

  try {
    fs.mkdirSync(DIR_DATA, { recursive: true });
    fs.writeFileSync(ARQ_HISTORICO, historico.join("\n") + "\n", "utf-8");
  } catch {
    // Histórico é conveniência: falha ao gravar não derruba o programa.
  }
}