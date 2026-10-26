import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AuthController } from '../controllers/auth.controller.js';
import { erroSchema } from '../schemas/swagger.schemas.js';
import { authenticate } from '../middlewares/auth.js';

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  const authController = new AuthController();

  app.post('/auth/login', {
    config: {
      rateLimit: process.env.NODE_ENV === 'test' ? false : {
        max: 5,
        timeWindow: '1 minute',
      },
    },
    schema: {
      tags: ['Autenticação'],
      summary: 'Realizar login na aplicação',
      security: [],
      body: z.object({
        email: z.string().email('E-mail em formato inválido'),
        senha: z.string().min(1, 'A senha é obrigatória'),
      }),
      response: {
        200: z.object({
          token: z.string(),
          usuario: z.object({
            id: z.string().uuid(),
            nome: z.string(),
            email: z.string(),
            role: z.string(),
          }),
        }),
        400: erroSchema,
        401: erroSchema,
        429: erroSchema,
      },
    },
  }, (req, reply) => authController.login(req, reply));

  app.get('/auth/me', {
    onRequest: [authenticate],
    schema: {
      tags: ['Autenticação'],
      summary: 'Retorna os dados do usuário autenticado',
      response: {
        200: z.object({
          sub: z.string().uuid(),
          role: z.string(),
        }),
        401: erroSchema,
      },
    },
  }, async (req, reply) => reply.send(req.user));
};