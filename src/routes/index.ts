import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { StatusEquipamento, StatusLote } from '@prisma/client';

import { OrganizacaoController } from '../controllers/organizacao.controller.js';
import { ContratoController } from '../controllers/contrato.controller.js';
import { LoteController } from '../controllers/lote.controller.js';
import { EquipamentoController } from '../controllers/equipamento.controller.js';
import { MovimentacaoController } from '../controllers/movimentacao.controller.js';

export async function appRoutes(app: FastifyInstance) {
  const orgController = new OrganizacaoController();
  const contratoController = new ContratoController();
  const loteController = new LoteController();
  const equipamentoController = new EquipamentoController();
  const movimentacaoController = new MovimentacaoController();

  // --- ORGANIZACAO ---
  app.post('/organizacoes', {
    schema: {
      tags: ['Organizações'],
      summary: 'Criar uma nova organização',
      body: z.object({
        nome: z.string().min(2),
        cnpj: z.string().length(14),
        tipo: z.string(),
      }),
    },
  }, (req, reply) => orgController.create(req, reply));

  app.get('/organizacoes', {
    schema: { tags: ['Organizações'], summary: 'Listar todas as organizações' },
  }, (req, reply) => orgController.index(req, reply));

  app.get('/organizacoes/:id', {
    schema: {
      tags: ['Organizações'],
      summary: 'Buscar organização por ID',
      params: z.object({ id: z.string().uuid() }),
    },
  }, (req, reply) => orgController.show(req, reply));

  // --- CONTRATO ---
  app.post('/contratos', {
    schema: {
      tags: ['Contratos'],
      summary: 'Criar um novo contrato',
      body: z.object({
        numeroContrato: z.string(),
        clausulas: z.any(),
        vigenciaInicio: z.string().datetime(),
        vigenciaFim: z.string().datetime(),
        organizacaoId: z.string().uuid(),
      }),
    },
  }, (req, reply) => contratoController.create(req, reply));

  app.get('/contratos', {
    schema: { tags: ['Contratos'], summary: 'Listar todos os contratos' },
  }, (req, reply) => contratoController.index(req, reply));

  // --- LOTE ---
  app.post('/lotes', {
    schema: {
      tags: ['Lotes'],
      summary: 'Criar um novo lote de equipamentos',
      body: z.object({
        codigo: z.string(),
        status: z.nativeEnum(StatusLote),
        organizacaoId: z.string().uuid(),
      }),
    },
  }, (req, reply) => loteController.create(req, reply));

  app.get('/lotes', {
    schema: { tags: ['Lotes'], summary: 'Listar todos os lotes' },
  }, (req, reply) => loteController.index(req, reply));

  // --- EQUIPAMENTO ---
  app.post('/equipamentos', {
    schema: {
      tags: ['Equipamentos'],
      summary: 'Cadastrar um novo equipamento',
      body: z.object({
        codigoBarrasInterno: z.string(),
        tipo: z.string(),
        status: z.nativeEnum(StatusEquipamento),
        loteId: z.string().uuid(),
      }),
    },
  }, (req, reply) => equipamentoController.create(req, reply));

  app.get('/equipamentos', {
    schema: {
      tags: ['Equipamentos'],
      summary: 'Listar equipamentos com paginação e filtro por status',
      querystring: z.object({
        status: z.nativeEnum(StatusEquipamento).optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
      }),
    },
  }, (req, reply) => equipamentoController.index(req, reply));

  // --- MOVIMENTACAO ---
  app.post('/movimentacoes', {
    schema: {
      tags: ['Movimentações'],
      summary: 'Registrar movimentação individual de equipamento com Bloqueio Otimista',
      body: z.object({
        equipamentoId: z.string().uuid(),
        statusNovo: z.nativeEnum(StatusEquipamento),
        observacao: z.string().optional(),
      }),
    },
  }, (req, reply) => movimentacaoController.create(req, reply));

  app.post('/movimentacoes/em-massa', {
    schema: {
      tags: ['Movimentações'],
      summary: 'Registrar movimentação em massa de equipamentos (Transacional)',
      body: z.object({
        equipamentosIds: z.array(z.string().uuid()),
        statusNovo: z.nativeEnum(StatusEquipamento),
        observacao: z.string().optional(),
      }),
    },
  }, (req, reply) => movimentacaoController.createEmMassa(req, reply));

  app.get('/movimentacoes/rastreabilidade/:equipamentoId', {
    schema: {
      tags: ['Movimentações'],
      summary: 'Obter histórico de rastreabilidade de um equipamento',
      params: z.object({ equipamentoId: z.string().uuid() }),
    },
  }, (req, reply) => movimentacaoController.rastrear(req, reply));
}