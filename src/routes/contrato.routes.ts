import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  erroSchema,
  contratoSchema,
} from '../schemas/swagger.schemas.js';
import { ContratoController } from '../controllers/contrato.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

export const contratoRoutes: FastifyPluginAsyncZod = async (app) => {
  const contratoController = new ContratoController();

  app.post('/contratos', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Contratos'],
      summary: 'Criar um novo contrato',
      body: z.object({
        numeroContrato: z.string().min(1),
        clausulas: z.record(z.unknown()).optional(),
        vigenciaInicio: z.string().datetime(),
        vigenciaFim: z.string().datetime(),
        organizacaoId: z.string().uuid(),
      }),
      response: {
        201: contratoSchema,
        400: erroSchema,
        401: erroSchema,
        403: erroSchema,
        404: erroSchema,
        409: erroSchema,
        422: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => contratoController.create(req, reply));

  app.get('/contratos', {
    onRequest: [authenticate],
    schema: {
      tags: ['Contratos'],
      summary: 'Listar todos os contratos',
      response: {
        200: z.array(contratoSchema),
        401: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => contratoController.index(req, reply));

  app.get('/contratos/:id', {
    onRequest: [authenticate],
    schema: {
      tags: ['Contratos'],
      summary: 'Buscar contrato por ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: contratoSchema,
        401: erroSchema,
        404: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => contratoController.show(req, reply));

  app.put('/contratos/:id', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Contratos'],
      summary: 'Atualizar vigência e cláusulas do contrato',
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        numeroContrato: z.string().optional(),
        clausulas: z.record(z.unknown()).optional(),
        vigenciaInicio: z.string().datetime().optional(),
        vigenciaFim: z.string().datetime().optional(),
      }),
      response: {
        200: contratoSchema,
        400: erroSchema,
        401: erroSchema,
        403: erroSchema,
        404: erroSchema,
        422: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => contratoController.update(req, reply));

  app.delete('/contratos/:id', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Contratos'],
      summary: 'Remover um contrato',
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        401: erroSchema,
        403: erroSchema,
        404: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => contratoController.delete(req, reply));
};