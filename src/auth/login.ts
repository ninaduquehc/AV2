import { verificarSenha } from "./senha.js";
import { buscarCredencial } from "./credenciais.js";

export function autenticar(
  usuario: string,
  senha: string
): { autenticado: boolean; papel: string | null } {
  const credencial = buscarCredencial(usuario);

  if (credencial && verificarSenha(senha, credencial.salt, credencial.hashSenha)) {
    return { autenticado: true, papel: credencial.papel };
  }
  return { autenticado: false, papel: null };
}