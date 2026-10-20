import { ARQ_CREDENCIAIS } from "../config/caminhos";
import { Repositorio } from "../persistence/repositorio";
import { gerarSalt, gerarHash } from "./senha";

export interface Credencial {
  usuario: string;
  salt: string;
  hashSenha: string;
  papel: string;
}

const repositorio = new Repositorio<Credencial>(ARQ_CREDENCIAIS);

export function buscarCredencial(usuario: string): Credencial | undefined {
  return repositorio.carregar().find((c) => c.usuario === usuario);
}

export function adicionarCredencial(usuario: string, senha: string, papel: string): boolean {
  const lista = repositorio.carregar();
  if (lista.some((c) => c.usuario === usuario)) return false;

  const salt = gerarSalt();
  lista.push({ usuario, salt, hashSenha: gerarHash(senha, salt), papel });
  repositorio.salvar(lista);
  return true;
}