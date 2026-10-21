import { app } from './app.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`🚀 Servidor GreenCode rodando na porta ${PORT}`);
    console.log(`📚 Documentação aberta em http://localhost:${PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Encerramento seguro (Graceful Shutdown)
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\nSinal ${signal} recebido. Encerrando o servidor com segurança...`);
    await app.close();
    console.log('Servidor encerrado.');
    process.exit(0);
  });
});

start();