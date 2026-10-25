import { FastifyRequest, FastifyReply } from 'fastify';
import { LoteService } from '../services/lote.service.js';
import { responderErro } from '../utils/http.js';

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
}