import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { authRoutes } from './routes/auth.routes.js';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { appRoutes } from './routes/index.js';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: A variável de ambiente JWT_SECRET é obrigatória e não foi configurada no .env');
}

export const app = Fastify({
  logger: true,
});

await app.register(cors, { origin: true });

await app.register(jwt, {
  secret: process.env.JWT_SECRET,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

await app.register(swagger, {
  openapi: {
    info: {
      title: 'GreenCode API',
      description: 'API RESTful para Logística Reversa e Economia Circular',
      version: '2.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  transform: jsonSchemaTransform,
});

await app.register(swaggerUi, {
  routePrefix: '/docs',
});

await app.register(authRoutes);
await app.register(appRoutes);

app.get('/health', {
  schema: { security: [] },
}, async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});