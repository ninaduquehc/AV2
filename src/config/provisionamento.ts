import * as fs from "fs";
import * as crypto from "crypto";
import { ARQ_CONFIG, ARQ_CREDENCIAIS } from "./caminhos";
import { escreverAtomico } from "../persistence/armazenamento";
import { registrarTransacao } from "../persistence/journal";
import { adicionarCredencial } from "../auth/credenciais";

export interface ConfiguracaoMestre {
  chaveAes: string;
  adminUsuario: string;
  provisionadoEm: string;
}

export function estaProvisionado(): boolean {
  return fs.existsSync(ARQ_CONFIG) && fs.existsSync(ARQ_CREDENCIAIS);
}

export function provisionar(senhaAdmin: string): void {
  const configuracao: ConfiguracaoMestre = {
    chaveAes: crypto.randomBytes(32).toString("hex"),
    adminUsuario: "admin",
    provisionadoEm: new Date().toISOString(),
  };

  // A chave precisa existir antes de qualquer arquivo criptografado.
  escreverAtomico(ARQ_CONFIG, JSON.stringify(configuracao, null, 2));
  adicionarCredencial(configuracao.adminUsuario, senhaAdmin, "administrador");
  registrarTransacao("sistema", "provisionamento", { adminUsuario: configuracao.adminUsuario });

  console.log("Provisionamento concluído. Administrador criado com sucesso.");
}