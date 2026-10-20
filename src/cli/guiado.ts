import { perguntar } from "./entrada";

export async function menuGuiadoExemplo(): Promise<void> {
  console.log("\n--- MENU GUIADO DE OPERAÇÃO ---");
  console.log("1. Cadastrar Organização");
  console.log("2. Registrar Lote");
  console.log("3. Voltar");

  const op = await perguntar("Escolha uma opção: ");
  if (op === "1") {
    console.log("Use o comando: organizacao criar --nome <NOME> --cnpj <CNPJ> --tipo <TIPO>");
  } else if (op === "2") {
    console.log("Use o comando: lote criar --org <ORG_ID> --nf <NUMERO> --transp <NOME>");
  }
}