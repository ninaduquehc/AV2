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

const schemaTipoOrg = z.enum(["gerador", "operador_logistico", "desmontadora", "comprador"]);

export async function appRoutes(app: FastifyInstance) {
  const orgController = new OrganizacaoController();
  const contratoController = new ContratoController();
  const loteController = new LoteController();
  const equipamentoController = new EquipamentoController();
  const movimentacaoController = new MovimentacaoController();

  // --- ORGANIZAÇÃO ---
  app.post('/organizacoes', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Organizações'],
      summary: 'Criar uma nova organização',
      body: z.object({
        nome: z.string().min(3, "Razão social deve possuir ao menos 3 caracteres"),
        // Valida os dígitos verificadores e salva só os números,
        // assim "11.222.333/0001-81" e "11222333000181" são o mesmo CNPJ.
        cnpj: z
          .string()
          .refine((val) => cnpjValido(val), { message: "CNPJ inválido" })
          .transform((val) => val.replace(/\D/g, "")),
        tipo: schemaTipoOrg,
      }),
    },
  }, (req, reply) => orgController.create(req, reply));

  app.get('/organizacoes', {
    onRequest: [authenticate],
    schema: { tags: ['Organizações'], summary: 'Listar todas as organizações' },
  }, (req, reply) => orgController.index(req, reply));

  app.get('/organizacoes/:id', {
    onRequest: [authenticate],
    schema: {
      tags: ['Organizações'],
      summary: 'Buscar organização por ID',
      params: z.object({ id: z.string().uuid() }),
    },
  }, (req, reply) => orgController.show(req, reply));

  // --- CONTRATO ---
  app.post('/contratos', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Contratos'],
      summary: 'Criar um novo contrato',
      body: z.object({
        numeroContrato: z.string().min(1),
        clausulas: z.any(),
        vigenciaInicio: z.string().datetime(),
        vigenciaFim: z.string().datetime(),
        organizacaoId: z.string().uuid(),
      }),
    },
  }, (req, reply) => contratoController.create(req, reply));

  app.get('/contratos', {
    onRequest: [authenticate],
    schema: { tags: ['Contratos'], summary: 'Listar todos os contratos' },
  }, (req, reply) => contratoController.index(req, reply));

  // --- LOTE ---
  app.post('/lotes', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Lotes'],
      summary: 'Criar um novo lote de equipamentos',
      body: z.object({
        codigo: z.string().min(1),
        status: z.nativeEnum(StatusLote),
        organizacaoId: z.string().uuid(),
      }),
    },
  }, (req, reply) => loteController.create(req, reply));

  app.get('/lotes', {
    onRequest: [authenticate],
    schema: { tags: ['Lotes'], summary: 'Listar todos os lotes' },
  }, (req, reply) => loteController.index(req, reply));

  // --- EQUIPAMENTO ---
  app.post('/equipamentos', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Equipamentos'],
      summary: 'Cadastrar um novo equipamento',
      body: z.object({
        codigoBarrasInterno: z.string().min(1),
        tipo: z.string().min(1),
        status: z.nativeEnum(StatusEquipamento),
        loteId: z.string().uuid(),
      }),
    },
  }, (req, reply) => equipamentoController.create(req, reply));

  app.get('/equipamentos', {
    onRequest: [authenticate],
    schema: {
      tags: ['Equipamentos'],
      summary: 'Listar equipamentos com paginação e filtro por status',
      querystring: z.object({
        status: z.nativeEnum(StatusEquipamento).optional(),
        page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
      }),
    },
  }, (req, reply) => equipamentoController.index(req, reply));

  // --- MOVIMENTAÇÃO ---
  app.post('/movimentacoes', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Movimentações'],
      summary: 'Registrar movimentação individual de equipamento com Bloqueio Otimista',
      body: z.object({
        equipamentoId: z.string().uuid(),
        statusNovo: z.nativeEnum(StatusEquipamento),
        version: z.number().int().min(0),
        observacao: z.string().optional(),
      }),
    },
  }, (req, reply) => movimentacaoController.create(req, reply));

  app.post('/movimentacoes/em-massa', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Movimentações'],
      summary: 'Registrar movimentação em massa (transacional, com bloqueio otimista por item)',
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
        statusNovo: z.nativeEnum(StatusEquipamento),
        observacao: z.string().optional(),
      }),
    },
  }, (req, reply) => movimentacaoController.createEmMassa(req, reply));

  app.get('/movimentacoes/rastreabilidade/:equipamentoId', {
    onRequest: [authenticate],
    schema: {
      tags: ['Movimentações'],
      summary: 'Obter histórico de rastreabilidade de um equipamento',
      params: z.object({ equipamentoId: z.string().uuid() }),
    },
  }, (req, reply) => movimentacaoController.rastrear(req, reply));
}