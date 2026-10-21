import { FastifyRequest, FastifyReply } from 'fastify';
import { OrganizacaoService } from '../services/organizacao.service.js';

export class OrganizacaoController {
  constructor(private service = new OrganizacaoService()) {}

  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as { nome: string; cnpj: string; tipo: string };
      const result = await this.service.criar(body);
      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  }

  async index(req: FastifyRequest, reply: FastifyReply) {
    const list = await this.service.listarTodas();
    return reply.send(list);
  }

  async show(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const org = await this.service.buscarPorId(id);
      return reply.send(org);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  }
}