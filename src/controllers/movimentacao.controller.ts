import { FastifyRequest, FastifyReply } from 'fastify';
import { StatusEquipamento } from '@prisma/client';
import { MovimentacaoService } from '../services/movimentacao.service.js';
import { responderErro } from '../utils/http.js';

export class MovimentacaoController {
  private service = new MovimentacaoService();

  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const usuarioId = req.user.sub;
      const { equipamentoId, statusNovo, version, observacao } = req.body as {
        equipamentoId: string;
        statusNovo: StatusEquipamento;
        version: number;
        observacao?: string;
      };

      const resultado = await this.service.movimentar(
        equipamentoId,
        statusNovo,
        version,
        usuarioId,
        observacao
      );

      return reply.status(201).send(resultado);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async createEmMassa(req: FastifyRequest, reply: FastifyReply) {
    try {
      const usuarioId = req.user.sub;
      const { itens, statusNovo, observacao } = req.body as {
        itens: Array<{ equipamentoId: string; version: number }>;
        statusNovo: StatusEquipamento;
        observacao?: string;
      };

      const resultado = await this.service.movimentarEmMassa(
        itens,
        statusNovo,
        usuarioId,
        observacao
      );

      return reply.status(201).send(resultado);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async rastrear(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { equipamentoId } = req.params as { equipamentoId: string };
      const historico = await this.service.rastrear(equipamentoId);
      return reply.send(historico);
    } catch (err) {
      return responderErro(reply, err);
    }
  }
}