import { FastifyRequest, FastifyReply } from 'fastify';
import { OrganizacaoService } from '../services/organizacao.service.js';
import { responderErro } from '../utils/http.js';

export class OrganizacaoController {
  constructor(private service = new OrganizacaoService()) {}

  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as { nome: string; cnpj: string; tipo: string };
      const result = await this.service.criar(body);
      return reply.status(201).send(result);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async index(req: FastifyRequest, reply: FastifyReply) {
    try {
      const list = await this.service.listarTodas();
      return reply.send(list);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async show(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const org = await this.service.buscarPorId(id);
      return reply.send(org);
    } catch (err) {
      return responderErro(reply, err);
    }
  }
}