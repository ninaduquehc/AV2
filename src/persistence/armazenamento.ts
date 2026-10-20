import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { ARQ_CONFIG } from "../config/caminhos";

function obterChaveAes(): Buffer {
  if (!fs.existsSync(ARQ_CONFIG)) {
    throw new Error("Sistema não provisionado. Configuração mestre não encontrada.");
  }
  const config = JSON.parse(fs.readFileSync(ARQ_CONFIG, "utf-8"));
  return Buffer.from(config.chaveAes, "hex");
}

export function criptografar(dados: string): string {
  const chave = obterChaveAes();
  const iv = crypto.randomBytes(12); // IV de 12 bytes recomendado para AES-GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", chave, iv);

  let encriptado = cipher.update(dados, "utf-8", "hex");
  encriptado += cipher.final("hex");

  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${encriptado}`;
}

export function descriptografar(dadosCriptografados: string): string {
  const chave = obterChaveAes();
  const partes = dadosCriptografados.split(":");

  if (partes.length !== 3) {
    throw new Error("Estrutura de arquivo criptografado inválida ou corrompida.");
  }

  const [ivHex, tagHex, conteudoHex] = partes;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", chave, iv);
  decipher.setAuthTag(tag);

  let decriptado = decipher.update(conteudoHex, "hex", "utf-8");
  decriptado += decipher.final("utf-8");

  return decriptado;
}

export function escreverAtomico(caminhoArquivo: string, conteudo: string, criptografarConteudo: boolean = false): void {
  const dir = path.dirname(caminhoArquivo);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const arquivoTmp = `${caminhoArquivo}.tmp_${Date.now()}`;
  const dadoFinal = criptografarConteudo ? criptografar(conteudo) : conteudo;

  fs.writeFileSync(arquivoTmp, dadoFinal, "utf-8");
  fs.renameSync(arquivoTmp, caminhoArquivo);
}

export function lerAtomico(caminhoArquivo: string, criptografado: boolean = false): string | null {
  if (!fs.existsSync(caminhoArquivo)) return null;
  const conteudo = fs.readFileSync(caminhoArquivo, "utf-8");
  if (!conteudo.trim()) return null;

  try {
    return criptografado ? descriptografar(conteudo) : conteudo;
  } catch (erro) {
    throw new Error(`Falha de integridade ao ler '${path.basename(caminhoArquivo)}': arquivo corrompido ou adulterado.`);
  }
}