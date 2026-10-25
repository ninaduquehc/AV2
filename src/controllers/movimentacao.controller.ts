import { FastifyRequest, FastifyReply } from 'fastify';
import { MovimentacaoService } from '../services/movimentacao.service.js';
import { StatusEquipamento } from '@prisma/client';
import { responderErro } from '../utils/http.js';

export class MovimentacaoController {
  constructor(private service = new MovimentacaoService()) {}

  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as {
        equipamentoId: string;
        statusNovo: StatusEquipamento;
        version: number;
        observacao?: string;
      };

      const result = await this.service.registrarMovimentacao({
        ...body,
        usuarioId: req.user.sub,
      });

      return reply.status(201).send(result);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async createEmMassa(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as {
        itens: { equipamentoId: string; version: number }[];
        statusNovo: StatusEquipamento;
        observacao?: string;
      };

      const result = await this.service.registrarMovimentacaoEmMassa({
        ...body,
        usuarioId: req.user.sub,
      });

      return reply.status(201).send(result);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async rastrear(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { equipamentoId } = req.params as { equipamentoId: string };
      const result = await this.service.obterRastreabilidade(equipamentoId);
      return reply.send(result);
    } catch (err) {
      return responderErro(reply, err);
    }
  }
}