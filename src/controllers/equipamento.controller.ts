import { FastifyRequest, FastifyReply } from 'fastify';
import { EquipamentoService } from '../services/equipamento.service.js';
import { StatusEquipamento } from '@prisma/client';
import { responderErro } from '../utils/http.js';

export class EquipamentoController {
  constructor(private service = new EquipamentoService()) {}

  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const result = await this.service.criar(body);
      return reply.status(201).send(result);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async index(req: FastifyRequest, reply: FastifyReply) {
    try {
      const query = req.query as {
        status?: StatusEquipamento;
        page?: number;
        limit?: number;
      };

      const result = await this.service.listarPaginado({
        status: query.status,
        page: query.page || 1,
        limit: query.limit || 10,
      });

      return reply.send(result);
    } catch (err) {
      return responderErro(reply, err);
    }
  }
}