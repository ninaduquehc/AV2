import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { responderErro } from '../utils/http.js';
import { AppError } from '../models/erros.js';

export class OrganizacaoController {
  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { nome, cnpj, tipo } = req.body as {
        nome: string;
        cnpj: string;
        tipo: string;
      };

      const orgExistente = await prisma.organizacao.findUnique({ where: { cnpj } });
      if (orgExistente) {
        throw new AppError('Já existe uma organização cadastrada com este CNPJ.', 409);
      }

      const organizacao = await prisma.organizacao.create({
        data: { nome, cnpj, tipo },
      });

      return reply.status(201).send(organizacao);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async index(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const organizacoes = await prisma.organizacao.findMany({
        include: {
          contrato: true,
        },
        orderBy: { nome: 'asc' },
      });

      return reply.send(organizacoes);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async show(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const organizacao = await prisma.organizacao.findUnique({
        where: { id },
        include: {
          contrato: true,
          lotes: true,
        },
      });

      if (!organizacao) {
        throw new AppError('Organização não encontrada.', 404);
      }

      return reply.send(organizacao);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async update(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { nome, cnpj, tipo } = req.body as {
        nome?: string;
        cnpj?: string;
        tipo?: string;
      };

      const organizacao = await prisma.organizacao.findUnique({ where: { id } });
      if (!organizacao) {
        throw new AppError('Organização não encontrada.', 404);
      }

      const orgAtualizada = await prisma.organizacao.update({
        where: { id },
        data: { nome, cnpj, tipo },
      });

      return reply.send(orgAtualizada);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async delete(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const organizacao = await prisma.organizacao.findUnique({
        where: { id },
        include: { contrato: true, lotes: true },
      });

      if (!organizacao) {
        throw new AppError('Organização não encontrada.', 404);
      }

      if (organizacao.contrato || organizacao.lotes.length > 0) {
        throw new AppError('Não é possível remover organizações que possuem contratos ou lotes vinculados.', 409);
      }

      await prisma.organizacao.delete({ where: { id } });
      return reply.status(204).send();
    } catch (err) {
      return responderErro(reply, err);
    }
  }
}