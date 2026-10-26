import { buildApp } from './app.js';

const app = await buildApp();
const port = Number(process.env.PORT) || 3000;

try {
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  console.log(`📖 Documentação Swagger em http://localhost:${port}/docs`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// Handler para Graceful Shutdown
const closeGracefully = async (signal: string) => {
  console.log(`\n⚠️ Sinal ${signal} recebido. Encerrando servidor graciosamente...`);
  try {
    await app.close();
    console.log('✅ Conexões e servidor encerrados com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao encerrar o servidor:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));