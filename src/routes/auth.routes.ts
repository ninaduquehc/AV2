import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { loginController } from '../controllers/auth.controller.js';

const erroSchema = z.object({
  error: z.string(),
  detalhes: z.array(z.object({ campo: z.string().optional(), mensagem: z.string().optional() })).optional(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post(
    '/auth/login',
    {
      schema: {
        description: 'Autentica um usuário e retorna o token JWT',
        tags: ['Autenticação'],
        security: [], // rota pública: não exige token
        body: z.object({
          email: z.string().trim().toLowerCase().email(),
          senha: z.string().min(1),
        }),
        response: {
          200: z.object({
            token: z.string(),
            usuario: z.object({
              id: z.string(),
              nome: z.string(),
              email: z.string(),
              role: z.string(),
            }),
          }),
          400: erroSchema,
          401: erroSchema,
        },
      },
    },
    loginController
  );
}