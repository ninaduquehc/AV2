import "dotenv/config"; // precisa ser o primeiro import: carrega o .env antes do app ler process.env
import { app } from "./app.js";

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

async function iniciar() {
  try {
    const endereco = await app.listen({ port: PORT, host: HOST });

    console.log(`\n🚀 Servidor HTTP rodando em: ${endereco}`);
    console.log(`📚 Documentação Swagger em: ${endereco}/docs`);
    console.log(`❤️  Health check em: ${endereco}/health\n`);
  } catch (erro) {
    app.log.error(erro);
    process.exit(1);
  }
}

// Encerramento seguro (graceful shutdown): para de aceitar conexões, termina as em andamento
// e fecha o Prisma (hook onClose do app.ts) antes de sair.
let encerrando = false;

async function encerrar(sinal: string) {
  if (encerrando) return;
  encerrando = true;

  console.log(`\nSinal ${sinal} recebido. Encerrando o servidor com segurança...`);
  try {
    await app.close();
    console.log("Servidor encerrado.");
    process.exit(0);
  } catch (erro) {
    console.error("Erro ao encerrar o servidor:", erro);
    process.exit(1);
  }
}

process.on("SIGINT", () => encerrar("SIGINT"));
process.on("SIGTERM", () => encerrar("SIGTERM"));

iniciar();