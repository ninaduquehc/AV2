import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { UsuarioController } from '../controllers/usuario.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { erroSchema } from '../schemas/swagger.schemas.js';

const usuarioSchema = z.object({
  id: z.string().uuid().describe("ID único do usuário"),
  nome: z.string().describe("Nome completo do usuário"),
  email: z.string().email().describe("E-mail corporativo cadastrado"),
  role: z.nativeEnum(Role).describe("Perfil de acesso (ADMIN, OPERADOR, CLIENTE)"),
  createdAt: z.string().datetime().optional(),
});

export const usuarioRoutes: FastifyPluginAsyncZod = async (app) => {
  const usuarioController = new UsuarioController();

  app.post('/usuarios', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Usuários'],
      summary: 'Cadastrar um novo usuário (Apenas Admin)',
      body: z.object({
        nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
        email: z.string().email('E-mail em formato inválido'),
        senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
        role: z.nativeEnum(Role).optional(),
      }),
      response: {
        201: usuarioSchema,
        400: erroSchema,
        401: erroSchema,
        403: erroSchema,
        409: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => usuarioController.create(req, reply));

  app.get('/usuarios', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Usuários'],
      summary: 'Listar todos os usuários cadastrados',
      response: {
        200: z.array(usuarioSchema),
        401: erroSchema,
        403: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => usuarioController.index(req, reply));

  app.delete('/usuarios/:id', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Usuários'],
      summary: 'Remover um usuário por ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        401: erroSchema,
        403: erroSchema,
        404: erroSchema,
        409: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => usuarioController.delete(req, reply));
};