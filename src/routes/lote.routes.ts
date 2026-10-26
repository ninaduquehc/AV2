import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  schemaStatusLote,
  erroSchema,
  loteSchema,
} from '../schemas/swagger.schemas.js';
import { LoteController } from '../controllers/lote.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

export const loteRoutes: FastifyPluginAsyncZod = async (app) => {
  const loteController = new LoteController();

  app.post('/lotes', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Lotes'],
      summary: 'Criar um novo lote de equipamentos',
      body: z.object({
        codigo: z.string().min(1),
        status: schemaStatusLote.optional(),
        organizacaoId: z.string().uuid(),
        dataRecebimento: z.string().datetime().optional(),
        equipamentos: z
          .array(
            z.object({
              codigoBarrasInterno: z.string().min(1),
              tipo: z.string().min(1),
            })
          )
          .optional(),
      }),
      response: {
        201: loteSchema,
        400: erroSchema,
        401: erroSchema,
        403: erroSchema,
        404: erroSchema,
        409: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => loteController.create(req, reply));

  app.get('/lotes', {
    onRequest: [authenticate],
    schema: {
      tags: ['Lotes'],
      summary: 'Listar todos os lotes',
      response: {
        200: z.array(loteSchema),
        401: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => loteController.index(req, reply));

  app.get('/lotes/:id', {
    onRequest: [authenticate],
    schema: {
      tags: ['Lotes'],
      summary: 'Buscar lote por ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: loteSchema,
        401: erroSchema,
        404: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => loteController.show(req, reply));

  app.put('/lotes/:id', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Lotes'],
      summary: 'Atualizar lote',
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        codigo: z.string().optional(),
        status: schemaStatusLote.optional(),
        dataRecebimento: z.string().datetime().optional(),
      }),
      response: {
        200: loteSchema,
        400: erroSchema,
        401: erroSchema,
        403: erroSchema,
        404: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => loteController.update(req, reply));

  app.delete('/lotes/:id', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Lotes'],
      summary: 'Remover um lote',
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
  }, (req, reply) => loteController.delete(req, reply));
};