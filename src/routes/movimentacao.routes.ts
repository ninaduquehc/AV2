import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  schemaStatusEquipamento,
  erroSchema,
  movimentacaoSchema,
} from '../schemas/swagger.schemas.js';
import { MovimentacaoController } from '../controllers/movimentacao.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

export const movimentacaoRoutes: FastifyPluginAsyncZod = async (app) => {
  const movimentacaoController = new MovimentacaoController();

  app.post('/movimentacoes', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Movimentações'],
      summary: 'Registrar movimentação individual com Bloqueio Otimista',
      body: z.object({
        equipamentoId: z.string().uuid(),
        statusNovo: schemaStatusEquipamento,
        version: z.number().int().min(0),
        observacao: z.string().optional(),
      }),
      response: {
        201: movimentacaoSchema,
        400: erroSchema,
        401: erroSchema,
        403: erroSchema,
        404: erroSchema,
        409: erroSchema,
        422: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => movimentacaoController.create(req, reply));

  app.post('/movimentacoes/em-massa', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Movimentações'],
      summary: 'Registrar movimentação em massa com Bloqueio Otimista por item',
      body: z.object({
        itens: z
          .array(
            z.object({
              equipamentoId: z.string().uuid(),
              version: z.number().int().min(0),
            })
          )
          .min(1)
          .max(100),
        statusNovo: schemaStatusEquipamento,
        observacao: z.string().optional(),
      }),
      response: {
        201: z.array(movimentacaoSchema),
        400: erroSchema,
        401: erroSchema,
        403: erroSchema,
        404: erroSchema,
        409: erroSchema,
        422: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => movimentacaoController.createEmMassa(req, reply));

  app.get('/movimentacoes/rastreabilidade/:equipamentoId', {
    onRequest: [authenticate],
    schema: {
      tags: ['Movimentações'],
      summary: 'Obter histórico de rastreabilidade de um equipamento',
      params: z.object({ equipamentoId: z.string().uuid() }),
      response: {
        200: z.array(movimentacaoSchema),
        401: erroSchema,
        404: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => movimentacaoController.rastrear(req, reply));
};