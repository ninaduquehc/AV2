import { FastifyRequest, FastifyReply } from 'fastify';
import { ContratoService } from '../services/contrato.service.js';
import { responderErro } from '../utils/http.js';

export class ContratoController {
  constructor(private service = new ContratoService()) {}

  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as {
        numeroContrato: string;
        clausulas?: Record<string, unknown>;
        vigenciaInicio: string;
        vigenciaFim: string;
        organizacaoId: string;
      };

      const result = await this.service.criar({
        ...body,
        vigenciaInicio: new Date(body.vigenciaInicio),
        vigenciaFim: new Date(body.vigenciaFim),
      });
      return reply.status(201).send(result);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async index(_req: FastifyRequest, reply: FastifyReply) {
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
      const contrato = await this.service.buscarPorId(id);
      return reply.send(contrato);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async update(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const body = req.body as {
        numeroContrato?: string;
        clausulas?: Record<string, unknown>;
        vigenciaInicio?: string;
        vigenciaFim?: string;
      };

      const dataToUpdate: {
        numeroContrato?: string;
        clausulas?: Record<string, unknown>;
        vigenciaInicio?: Date;
        vigenciaFim?: Date;
      } = { ...body, vigenciaInicio: undefined, vigenciaFim: undefined };

      if (body.vigenciaInicio) dataToUpdate.vigenciaInicio = new Date(body.vigenciaInicio);
      if (body.vigenciaFim) dataToUpdate.vigenciaFim = new Date(body.vigenciaFim);

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