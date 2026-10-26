import { FastifyRequest, FastifyReply } from 'fastify';
import { OrganizacaoService } from '../services/organizacao.service.js';
import { responderErro } from '../utils/http.js';
import { TipoOrganizacao } from '../schemas/swagger.schemas.js';

export class OrganizacaoController {
  private service = new OrganizacaoService();

  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as { nome: string; cnpj: string; tipo: TipoOrganizacao };
      const org = await this.service.create(body);
      return reply.status(201).send(org);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async index(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const orgs = await this.service.findAll();
      return reply.send(orgs);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async show(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const org = await this.service.findById(id);
      return reply.send(org);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async update(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const body = req.body as { nome?: string; cnpj?: string; tipo?: TipoOrganizacao };
      const org = await this.service.update(id, body);
      return reply.send(org);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async delete(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      await this.service.delete(id);
      return reply.status(204).send();
    } catch (err) {
      return responderErro(reply, err);
    }
  }
}