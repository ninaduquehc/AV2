import { FastifyRequest, FastifyReply } from 'fastify';
import { ContratoService } from '../services/contrato.service.js';

export class ContratoController {
  constructor(private service = new ContratoService()) {}

  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const result = await this.service.criar({
        ...body,
        vigenciaInicio: new Date(body.vigenciaInicio),
        vigenciaFim: new Date(body.vigenciaFim),
      });
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