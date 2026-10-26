import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthController } from '../controllers/auth.controller.js';

const erroSchema = z.object({
  error: z.string(),
  detalhes: z.array(z.object({ campo: z.string().optional(), mensagem: z.string().optional() })).optional(),
});

export async function authRoutes(app: FastifyInstance) {
  const authController = new AuthController();

  app.post('/auth/login', {
    schema: {
      tags: ['Autenticação'],
      summary: 'Realizar login na aplicação',
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
      },
    },
  }, (req, reply) => authController.login(req, reply));
}