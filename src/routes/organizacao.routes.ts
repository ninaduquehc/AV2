import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  schemaTipoOrg,
  erroSchema,
  organizacaoSchema,
} from '../schemas/swagger.schemas.js';
import { OrganizacaoController } from '../controllers/organizacao.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { cnpjValido } from '../utils/cnpj.js';

export const organizacaoRoutes: FastifyPluginAsyncZod = async (app) => {
  const orgController = new OrganizacaoController();

  app.post('/organizacoes', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Organizações'],
      summary: 'Criar uma nova organização',
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
        500: erroSchema,
      },
    },
  }, (req, reply) => orgController.create(req, reply));

  app.get('/organizacoes', {
    onRequest: [authenticate],
    schema: {
      tags: ['Organizações'],
      summary: 'Listar todas as organizações',
      response: {
        200: z.array(organizacaoSchema),
        401: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => orgController.index(req, reply));

  app.get('/organizacoes/:id', {
    onRequest: [authenticate],
    schema: {
      tags: ['Organizações'],
      summary: 'Buscar organização por ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: organizacaoSchema,
        401: erroSchema,
        404: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => orgController.show(req, reply));

  app.put('/organizacoes/:id', {
    onRequest: [authenticate, authorize(['ADMIN', 'OPERADOR'])],
    schema: {
      tags: ['Organizações'],
      summary: 'Atualizar dados de uma organização',
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
        403: erroSchema,
        404: erroSchema,
        409: erroSchema,
        500: erroSchema,
      },
    },
  }, (req, reply) => orgController.update(req, reply));

  app.delete('/organizacoes/:id', {
    onRequest: [authenticate, authorize(['ADMIN'])],
    schema: {
      tags: ['Organizações'],
      summary: 'Remover uma organização',
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
  }, (req, reply) => orgController.delete(req, reply));
};