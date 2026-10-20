export const log = {
  info: (mensagem: string) => console.log(`[INFO] ${mensagem}`),
  sucesso: (mensagem: string) => console.log(`[SUCESSO] ${mensagem}`),
  aviso: (mensagem: string) => console.log(`[AVISO] ${mensagem}`),
  erro: (mensagem: string) => console.error(`[ERRO] ${mensagem}`),
};