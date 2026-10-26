import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { organizacaoRoutes } from './organizacao.routes.js';
import { contratoRoutes } from './contrato.routes.js';
import { loteRoutes } from './lote.routes.js';
import { equipamentoRoutes } from './equipamento.routes.js';
import { movimentacaoRoutes } from './movimentacao.routes.js';

export const appRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(organizacaoRoutes);
  await app.register(contratoRoutes);
  await app.register(loteRoutes);
  await app.register(equipamentoRoutes);
  await app.register(movimentacaoRoutes);
};