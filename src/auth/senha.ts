import * as crypto from "crypto";

export function gerarSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function gerarHash(senha: string, salt: string): string {
  return crypto.createHash("sha256").update(salt + senha).digest("hex");
}

export function verificarSenha(senha: string, salt: string, hashArmazenado: string): boolean {
  const calculado = Buffer.from(gerarHash(senha, salt), "hex");
  const armazenado = Buffer.from(hashArmazenado, "hex");
  return calculado.length === armazenado.length && crypto.timingSafeEqual(calculado, armazenado);
}