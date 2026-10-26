import { FastifyRequest, FastifyReply } from 'fastify';
import { LoteService } from '../services/lote.service.js';
import { responderErro } from '../utils/http.js';
import { StatusLote } from '@prisma/client';

export class LoteController {
  constructor(private service = new LoteService()) {}

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
      const result = await this.service.listarTodos();
      return reply.send(result);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async show(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const lote = await this.service.buscarPorId(id);
      return reply.send(lote);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async update(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const body = req.body as { codigo?: string; status?: StatusLote; dataRecebimento?: string };
      const dataToUpdate: any = { ...body };
      if (body.dataRecebimento) dataToUpdate.dataRecebimento = new Date(body.dataRecebimento);

      const result = await this.service.atualizar(id, dataToUpdate);
      return reply.send(result);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async delete(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      await this.service.remover(id);
      return reply.status(204).send();
    } catch (err) {
      return responderErro(reply, err);
    }
  }
}