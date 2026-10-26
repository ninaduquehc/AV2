import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { UsuarioController } from '../controllers/usuario.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const erroSchema = z.object({
  error: z.string(),
  detalhes: z.array(z.object({ campo: z.string().optional(), mensagem: z.string().optional() })).optional(),
});

const usuarioSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(Role),
  createdAt: z.string().or(z.date()).optional(),
});

export async function usuarioRoutes(app: FastifyInstance) {
  const controller = new UsuarioController();

  app.post('/usuarios', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Usuários'],
      summary: 'Cadastrar novo usuário (Apenas ADMIN)',
      security: [{ bearerAuth: [] }],
      body: z.object({
        nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
        email: z.string().email('E-mail inválido'),
        senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
        role: z.nativeEnum(Role).optional(),
      }),
      response: {
        201: usuarioSchema,
        400: erroSchema,
        401: erroSchema,
        403: erroSchema,
        409: erroSchema,
      },
    },
  }, (req, reply) => controller.create(req, reply));

  app.get('/usuarios', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Usuários'],
      summary: 'Listar todos os usuários (Apenas ADMIN)',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.array(usuarioSchema),
        401: erroSchema,
        403: erroSchema,
      },
    },
  }, (req, reply) => controller.index(req, reply));

  app.delete('/usuarios/:id', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Usuários'],
      summary: 'Remover usuário (Apenas ADMIN)',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        401: erroSchema,
        403: erroSchema,
        404: erroSchema,
      },
    },
  }, (req, reply) => controller.delete(req, reply));
}