import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { ARQ_JOURNAL, DIR_DATA } from "../config/caminhos";
import { criptografar, descriptografar } from "./armazenamento";

const TAMANHO_MAXIMO_JOURNAL_BYTES = 10 * 1024 * 1024; // 10MB
const RETENCAO_DIAS = 180;
const HASH_INICIAL = "0".repeat(64);
const PREFIXO_BACKUP = "journal.log.";
const SUFIXO_BACKUP = ".bak";

export interface EntradaJournal {
  id: string;
  timestamp: string;
  usuario: string;
  acao: string;
  detalhes: Record<string, any>;
  hashAnterior: string;
  hashAtual: string;
}

// Carregado do disco na primeira gravação de cada execução (a cadeia continua entre sessões).
let ultimoHash: string | null = null;

function calcularHashEntrada(dados: Omit<EntradaJournal, "hashAtual">): string {
  const carga = `${dados.id}|${dados.timestamp}|${dados.usuario}|${dados.acao}|${JSON.stringify(dados.detalhes)}|${dados.hashAnterior}`;
  return crypto.createHash("sha256").update(carga).digest("hex");
}

// Backups em ordem cronológica, depois o arquivo atual.
function listarArquivosDoJournal(): string[] {
  const backups = fs.existsSync(DIR_DATA)
    ? fs
        .readdirSync(DIR_DATA)
        .filter((f) => f.startsWith(PREFIXO_BACKUP) && f.endsWith(SUFIXO_BACKUP))
        .sort()
        .map((f) => path.join(DIR_DATA, f))
    : [];
  return fs.existsSync(ARQ_JOURNAL) ? [...backups, ARQ_JOURNAL] : backups;
}

// Cada linha é um registro criptografado. Linha ilegível vira null (fica detectável).
function lerRegistros(): (EntradaJournal | null)[] {
  const registros: (EntradaJournal | null)[] = [];

  for (const arquivo of listarArquivosDoJournal()) {
    const linhas = fs.readFileSync(arquivo, "utf-8").split("\n");
    for (const linha of linhas) {
      if (!linha.trim()) continue;
      try {
        registros.push(JSON.parse(descriptografar(linha)) as EntradaJournal);
      } catch {
        registros.push(null);
      }
    }
  }
  return registros;
}

function limparBackupsAntigos(): void {
  const limite = new Date();
  limite.setDate(limite.getDate() - RETENCAO_DIAS);

  for (const arquivo of listarArquivosDoJournal()) {
    if (arquivo === ARQ_JOURNAL) continue;
    if (fs.statSync(arquivo).mtime < limite) fs.unlinkSync(arquivo);
  }
}

function verificarEAtuarRotacao(): void {
  if (!fs.existsSync(ARQ_JOURNAL)) return;

  if (fs.statSync(ARQ_JOURNAL).size >= TAMANHO_MAXIMO_JOURNAL_BYTES) {
    fs.renameSync(ARQ_JOURNAL, `${ARQ_JOURNAL}.${Date.now()}${SUFIXO_BACKUP}`);
    limparBackupsAntigos();
  }
}

export function registrarTransacao(usuario: string, acao: string, detalhes: Record<string, any>): void {
  verificarEAtuarRotacao();

  if (ultimoHash === null) {
    const validos = lerRegistros().filter((r): r is EntradaJournal => r !== null);
    ultimoHash = validos.length > 0 ? validos[validos.length - 1].hashAtual : HASH_INICIAL;
  }

  const parcial = {
    id: `TX-${crypto.randomUUID()}`,
    timestamp: new Date().toISOString(),
    usuario,
    acao,
    detalhes,
    hashAnterior: ultimoHash,
  };

  const completa: EntradaJournal = { ...parcial, hashAtual: calcularHashEntrada(parcial) };

  fs.mkdirSync(DIR_DATA, { recursive: true });
  fs.appendFileSync(ARQ_JOURNAL, criptografar(JSON.stringify(completa)) + "\n", "utf-8");
  ultimoHash = completa.hashAtual;
}

export function lerJournal(): EntradaJournal[] {
  const registros = lerRegistros();
  const ilegiveis = registros.filter((r) => r === null).length;
  if (ilegiveis > 0) {
    console.error(`[AVISO] ${ilegiveis} linha(s) do journal ilegíveis foram ignoradas.`);
  }
  return registros.filter((r): r is EntradaJournal => r !== null);
}

// Retorna a posição do primeiro registro inválido, ou -1 se a cadeia está íntegra.
export function verificarIntegridadeJournal(): number {
  const registros = lerRegistros();
  let esperado: string | null = null; // o 1º registro é a âncora (backups antigos podem ter sido removidos)

  for (let i = 0; i < registros.length; i++) {
    const registro = registros[i];
    if (registro === null) return i; // linha adulterada ou ilegível

    const { hashAtual, ...parcial } = registro;
    if (calcularHashEntrada(parcial) !== hashAtual) return i; // conteúdo editado
    if (esperado !== null && registro.hashAnterior !== esperado) return i; // registro removido/reordenado

    esperado = hashAtual;
  }
  return -1;
}