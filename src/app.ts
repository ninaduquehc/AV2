import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { authRoutes } from './routes/auth.routes.js';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { appRoutes } from './routes/index.js';

export const app = Fastify({
  logger: true,
});

// Registra CORS para permitir requisições de clientes web
await app.register(cors, { origin: true });

// Registra autenticação JWT
await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'fallback_secret',
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Registra Swagger (Geração da Documentação OpenAPI)
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
  },
  transform: jsonSchemaTransform,
});

await app.register(swaggerUi, {
  routePrefix: '/docs',
});

// Registra as rotas da API
await app.register(authRoutes);
await app.register(appRoutes);

// Rota de verificação de saúde da aplicação (Healthcheck)
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});