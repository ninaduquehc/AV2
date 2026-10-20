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

export function listarCredenciais(): Credencial[] {
  return repositorio.carregar();
}

export function adicionarCredencial(usuario: string, senha: string, papel: string): boolean {
  const lista = repositorio.carregar();
  if (lista.some((c) => c.usuario === usuario)) return false;

  const salt = gerarSalt();
  lista.push({ usuario, salt, hashSenha: gerarHash(senha, salt), papel });
  repositorio.salvar(lista);
  return true;
}

// Atualiza senha e/ou papel. Retorna false se o usuário não existe.
export function atualizarCredencial(usuario: string, alteracoes: { senha?: string; papel?: string }): boolean {
  const lista = repositorio.carregar();
  const indice = lista.findIndex((c) => c.usuario === usuario);
  if (indice === -1) return false;

  if (alteracoes.senha) {
    const salt = gerarSalt(); // salt novo a cada troca de senha
    lista[indice].salt = salt;
    lista[indice].hashSenha = gerarHash(alteracoes.senha, salt);
  }
  if (alteracoes.papel) {
    lista[indice].papel = alteracoes.papel;
  }

  repositorio.salvar(lista);
  return true;
}

export function removerCredencial(usuario: string): boolean {
  const lista = repositorio.carregar();
  const restante = lista.filter((c) => c.usuario !== usuario);
  if (restante.length === lista.length) return false;

  repositorio.salvar(restante);
  return true;
}
