import { FastifyRequest, FastifyReply } from 'fastify';
import { LoteService } from '../services/lote.service.js';

export class LoteController {
  constructor(private service = new LoteService()) {}

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
    const result = await this.service.listarTodos();
    return reply.send(result);
  }
}