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