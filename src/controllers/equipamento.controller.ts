import { FastifyRequest, FastifyReply } from 'fastify';
import { EquipamentoService } from '../services/equipamento.service.js';
import { StatusEquipamento } from '@prisma/client';

export class EquipamentoController {
  constructor(private service = new EquipamentoService()) {}

  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const result = await this.service.criar(body);
      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  }

async index(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as {
      status?: StatusEquipamento;
      page?: string;
      limit?: string;
    };

    const result = await this.service.listarPaginado({
      status: query.status,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
    });

    return reply.send(result);
  }
}