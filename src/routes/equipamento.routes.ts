import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  schemaStatusEquipamento,
  erroSchema,
  equipamentoSchema,
} from '../schemas/swagger.schemas.js';
import { EquipamentoController } from '../controllers/equipamento.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

export const equipamentoRoutes: FastifyPluginAsyncZod = async (app) => {
  const equipamentoController = new EquipamentoController();

  app.post('/equipamentos', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Equipamentos'],
      summary: 'Cadastrar um novo equipamento',
      body: z.object({
        codigoBarrasInterno: z.string().min(1),
        tipo: z.string().min(1),
        status: schemaStatusEquipamento.optional(),
        loteId: z.string().uuid(),
      }),
      response: {
        201: equipamentoSchema,
        400: erroSchema,
        401: erroSchema,
        403: erroSchema,
        404: erroSchema,
        409: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => equipamentoController.create(req, reply));

  app.get('/equipamentos', {
    onRequest: [authenticate],
    schema: {
      tags: ['Equipamentos'],
      summary: 'Listar equipamentos com paginação e filtro por status',
      querystring: z.object({
        status: schemaStatusEquipamento.optional(),
        page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
      }),
      response: {
        200: z.object({
          total: z.number(),
          page: z.number(),
          limit: z.number(),
          totalPages: z.number(),
          data: z.array(equipamentoSchema),
        }),
        401: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => equipamentoController.index(req, reply));

  app.get('/equipamentos/:id', {
    onRequest: [authenticate],
    schema: {
      tags: ['Equipamentos'],
      summary: 'Buscar equipamento por ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: equipamentoSchema,
        401: erroSchema,
        404: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => equipamentoController.show(req, reply));

  app.put('/equipamentos/:id', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Equipamentos'],
      summary: 'Atualizar tipo de um equipamento',
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        tipo: z.string().min(1).optional(),
      }),
      response: {
        200: equipamentoSchema,
        400: erroSchema,
        401: erroSchema,
        403: erroSchema,
        404: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => equipamentoController.update(req, reply));

  app.delete('/equipamentos/:id', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Equipamentos'],
      summary: 'Remover um equipamento',
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
  }, (req, reply) => equipamentoController.delete(req, reply));
};