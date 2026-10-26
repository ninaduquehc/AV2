import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { StatusEquipamento, StatusLote } from '@prisma/client';

import { OrganizacaoController } from '../controllers/organizacao.controller.js';
import { ContratoController } from '../controllers/contrato.controller.js';
import { LoteController } from '../controllers/lote.controller.js';
import { EquipamentoController } from '../controllers/equipamento.controller.js';
import { MovimentacaoController } from '../controllers/movimentacao.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { cnpjValido } from '../utils/cnpj.js';

// Enums nativos do Prisma para sincronia total com o banco de dados
const schemaTipoOrg = z.enum(["gerador", "operador_logistico", "desmontadora", "comprador"]);
const schemaStatusLote = z.nativeEnum(StatusLote);
const schemaStatusEquipamento = z.nativeEnum(StatusEquipamento);

const erroSchema = z.object({
  error: z.string(),
  detalhes: z.array(z.object({ campo: z.string().optional(), mensagem: z.string().optional() })).optional(),
});

const organizacaoSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  cnpj: z.string(),
  tipo: schemaTipoOrg,
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
  contrato: z.any().optional(),
  lotes: z.array(z.any()).optional(),
});

const contratoSchema = z.object({
  id: z.string().uuid(),
  numeroContrato: z.string(),
  clausulas: z.any().optional(),
  vigenciaInicio: z.string().or(z.date()),
  vigenciaFim: z.string().or(z.date()),
  organizacaoId: z.string().uuid(),
  createdAt: z.string().or(z.date()).optional(),
  organizacao: z.any().optional(),
});

const loteSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string(),
  status: schemaStatusLote,
  dataRecebimento: z.string().or(z.date()),
  organizacaoId: z.string().uuid(),
  createdAt: z.string().or(z.date()).optional(),
  organizacao: z.any().optional(),
  equipamentos: z.array(z.any()).optional(),
  _count: z.any().optional(),
});

const equipamentoSchema = z.object({
  id: z.string().uuid(),
  codigoBarrasInterno: z.string(),
  tipo: z.string(),
  status: schemaStatusEquipamento,
  version: z.number().int(),
  loteId: z.string().uuid(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
  lote: z.any().optional(),
  movimentacoes: z.array(z.any()).optional(),
});

const movimentacaoSchema = z.object({
  id: z.string().uuid(),
  dataHora: z.string().or(z.date()),
  equipamentoId: z.string().uuid(),
  usuarioId: z.string().uuid(),
  statusAnterior: schemaStatusEquipamento,
  statusNovo: schemaStatusEquipamento,
  observacao: z.string().nullable().optional(),
});

export async function appRoutes(app: FastifyInstance) {
  const orgController = new OrganizacaoController();
  const contratoController = new ContratoController();
  const loteController = new LoteController();
  const equipamentoController = new EquipamentoController();
  const movimentacaoController = new MovimentacaoController();

  // ============================================================
  // ORGANIZAÇÃO
  // ============================================================
  app.post('/organizacoes', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Organizações'],
      summary: 'Criar uma nova organização',
      security: [{ bearerAuth: [] }],
      body: z.object({
        nome: z.string().min(3, "Razão social deve possuir ao menos 3 caracteres"),
        cnpj: z
          .string()
          .refine((val) => cnpjValido(val), { message: "CNPJ inválido" })
          .transform((val) => val.replace(/\D/g, "")),
        tipo: schemaTipoOrg,
      }),
      response: {
        201: organizacaoSchema,
        400: erroSchema,
        401: erroSchema,
        403: erroSchema,
        409: erroSchema,
      },
    },
  }, (req, reply) => orgController.create(req, reply));

  app.get('/organizacoes', {
    onRequest: [authenticate],
    schema: {
      tags: ['Organizações'],
      summary: 'Listar todas as organizações',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.array(organizacaoSchema),
        401: erroSchema,
      },
    },
  }, (req, reply) => orgController.index(req, reply));

  app.get('/organizacoes/:id', {
    onRequest: [authenticate],
    schema: {
      tags: ['Organizações'],
      summary: 'Buscar organização por ID',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: organizacaoSchema,
        401: erroSchema,
        404: erroSchema,
      },
    },
  }, (req, reply) => orgController.show(req, reply));

  app.put('/organizacoes/:id', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Organizações'],
      summary: 'Atualizar dados de uma organização',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        nome: z.string().min(3).optional(),
        cnpj: z.string().refine((val) => cnpjValido(val), { message: "CNPJ inválido" }).transform((val) => val.replace(/\D/g, "")).optional(),
        tipo: schemaTipoOrg.optional(),
      }),
      response: {
        200: organizacaoSchema,
        400: erroSchema,
        401: erroSchema,
        404: erroSchema,
        409: erroSchema,
      },
    },
  }, (req, reply) => orgController.update(req, reply));

  app.delete('/organizacoes/:id', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Organizações'],
      summary: 'Remover uma organização',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        401: erroSchema,
        403: erroSchema,
        404: erroSchema,
        409: erroSchema,
      },
    },
  }, (req, reply) => orgController.delete(req, reply));

  // ============================================================
  // CONTRATO
  // ============================================================
  app.post('/contratos', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Contratos'],
      summary: 'Criar um novo contrato',
      security: [{ bearerAuth: [] }],
      body: z.object({
        numeroContrato: z.string().min(1),
        clausulas: z.any().optional(),
        vigenciaInicio: z.string().datetime(),
        vigenciaFim: z.string().datetime(),
        organizacaoId: z.string().uuid(),
      }),
      response: {
        201: contratoSchema,
        400: erroSchema,
        401: erroSchema,
        404: erroSchema,
        409: erroSchema,
        422: erroSchema,
      },
    },
  }, (req, reply) => contratoController.create(req, reply));

  app.get('/contratos', {
    onRequest: [authenticate],
    schema: {
      tags: ['Contratos'],
      summary: 'Listar todos os contratos',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.array(contratoSchema),
        401: erroSchema,
      },
    },
  }, (req, reply) => contratoController.index(req, reply));

  app.get('/contratos/:id', {
    onRequest: [authenticate],
    schema: {
      tags: ['Contratos'],
      summary: 'Buscar contrato por ID',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: contratoSchema,
        401: erroSchema,
        404: erroSchema,
      },
    },
  }, (req, reply) => contratoController.show(req, reply));

  app.put('/contratos/:id', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Contratos'],
      summary: 'Atualizar vigência e cláusulas do contrato',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        numeroContrato: z.string().optional(),
        clausulas: z.any().optional(),
        vigenciaInicio: z.string().datetime().optional(),
        vigenciaFim: z.string().datetime().optional(),
      }),
      response: {
        200: contratoSchema,
        400: erroSchema,
        401: erroSchema,
        404: erroSchema,
        422: erroSchema,
      },
    },
  }, (req, reply) => contratoController.update(req, reply));

  app.delete('/contratos/:id', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Contratos'],
      summary: 'Remover um contrato',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        401: erroSchema,
        403: erroSchema,
        404: erroSchema,
      },
    },
  }, (req, reply) => contratoController.delete(req, reply));

  // ============================================================
  // LOTE
  // ============================================================
  app.post('/lotes', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Lotes'],
      summary: 'Criar um novo lote de equipamentos (com suporte a criação transacional de equipamentos)',
      security: [{ bearerAuth: [] }],
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
        404: erroSchema,
        409: erroSchema,
      },
    },
  }, (req, reply) => loteController.create(req, reply));

  app.get('/lotes', {
    onRequest: [authenticate],
    schema: {
      tags: ['Lotes'],
      summary: 'Listar todos os lotes',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.array(loteSchema),
        401: erroSchema,
      },
    },
  }, (req, reply) => loteController.index(req, reply));

  app.get('/lotes/:id', {
    onRequest: [authenticate],
    schema: {
      tags: ['Lotes'],
      summary: 'Buscar lote por ID',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: loteSchema,
        401: erroSchema,
        404: erroSchema,
      },
    },
  }, (req, reply) => loteController.show(req, reply));

  app.put('/lotes/:id', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Lotes'],
      summary: 'Atualizar lote',
      security: [{ bearerAuth: [] }],
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
        404: erroSchema,
      },
    },
  }, (req, reply) => loteController.update(req, reply));

  app.delete('/lotes/:id', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Lotes'],
      summary: 'Remover um lote',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        401: erroSchema,
        403: erroSchema,
        404: erroSchema,
        409: erroSchema,
      },
    },
  }, (req, reply) => loteController.delete(req, reply));

  // ============================================================
  // EQUIPAMENTO
  // ============================================================
  app.post('/equipamentos', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Equipamentos'],
      summary: 'Cadastrar um novo equipamento',
      security: [{ bearerAuth: [] }],
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
        404: erroSchema,
        409: erroSchema,
      },
    },
  }, (req, reply) => equipamentoController.create(req, reply));

  app.get('/equipamentos', {
    onRequest: [authenticate],
    schema: {
      tags: ['Equipamentos'],
      summary: 'Listar equipamentos com paginação e filtro por status',
      security: [{ bearerAuth: [] }],
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
      },
    },
  }, (req, reply) => equipamentoController.index(req, reply));

  app.get('/equipamentos/:id', {
    onRequest: [authenticate],
    schema: {
      tags: ['Equipamentos'],
      summary: 'Buscar equipamento por ID',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: equipamentoSchema,
        401: erroSchema,
        404: erroSchema,
      },
    },
  }, (req, reply) => equipamentoController.show(req, reply));

  app.put('/equipamentos/:id', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Equipamentos'],
      summary: 'Atualizar tipo de um equipamento',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        tipo: z.string().min(1).optional(),
      }),
      response: {
        200: equipamentoSchema,
        400: erroSchema,
        401: erroSchema,
        404: erroSchema,
      },
    },
  }, (req, reply) => equipamentoController.update(req, reply));

  app.delete('/equipamentos/:id', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Equipamentos'],
      summary: 'Remover um equipamento',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        401: erroSchema,
        403: erroSchema,
        404: erroSchema,
        409: erroSchema,
      },
    },
  }, (req, reply) => equipamentoController.delete(req, reply));

  // ============================================================
  // MOVIMENTAÇÃO & RASTREABILIDADE
  // ============================================================
  app.post('/movimentacoes', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Movimentações'],
      summary: 'Registrar movimentação individual com Bloqueio Otimista',
      security: [{ bearerAuth: [] }],
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
        404: erroSchema,
        409: erroSchema,
        422: erroSchema,
      },
    },
  }, (req, reply) => movimentacaoController.create(req, reply));

  app.post('/movimentacoes/em-massa', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Movimentações'],
      summary: 'Registrar movimentação em massa (transacional, com bloqueio otimista por item)',
      security: [{ bearerAuth: [] }],
      body: z.object({
        itens: z
          .array(
            z.object({
              equipamentoId: z.string().uuid(),
              version: z.number().int().min(0),
            })
          )
          .min(1)
          .max(100)
          .refine(
            (itens) => new Set(itens.map((i) => i.equipamentoId)).size === itens.length,
            { message: 'Há equipamentos repetidos na lista.' }
          ),
        statusNovo: schemaStatusEquipamento,
        observacao: z.string().optional(),
      }),
      response: {
        201: z.array(movimentacaoSchema),
        400: erroSchema,
        401: erroSchema,
        404: erroSchema,
        409: erroSchema,
      },
    },
  }, (req, reply) => movimentacaoController.createEmMassa(req, reply));

  app.get('/movimentacoes/rastreabilidade/:equipamentoId', {
    onRequest: [authenticate],
    schema: {
      tags: ['Movimentações'],
      summary: 'Obter histórico de rastreabilidade de um equipamento',
      security: [{ bearerAuth: [] }],
      params: z.object({ equipamentoId: z.string().uuid() }),
      response: {
        200: z.array(movimentacaoSchema),
        401: erroSchema,
        404: erroSchema,
      },
    },
  }, (req, reply) => movimentacaoController.rastrear(req, reply));
}