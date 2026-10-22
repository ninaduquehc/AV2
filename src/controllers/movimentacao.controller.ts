import { FastifyRequest, FastifyReply } from 'fastify';
import { MovimentacaoService } from '../services/movimentacao.service.js';
import { StatusEquipamento } from '@prisma/client';

export class MovimentacaoController {
  constructor(private service = new MovimentacaoService()) { }

  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as {
        equipamentoId: string;
        statusNovo: StatusEquipamento;
        observacao?: string;
      };
      const user = (req as any).user;

      const result = await this.service.registrarMovimentacao({
        ...body,
        usuarioId: user.sub,
      });

      return reply.status(201).send(result);
    } catch (err: any) {
      // ADICIONAR ESTA CHECAGEM DE ERRO DE CONCORRÊNCIA:
      if (err.message.includes('CONCURRENCY_ERROR')) {
        return reply.status(409).send({ error: err.message }); // HTTP 409 Conflict
      }
      return reply.status(400).send({ error: err.message });
    }
  }

  // ADICIONAR ESTE NOVO MÉTODO ABAIXO DO MÉTODO create()

  async createEmMassa(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as {
        equipamentosIds: string[];
        statusNovo: StatusEquipamento;
        observacao?: string;
      };
      const user = (req as any).user;

      const result = await this.service.registrarMovimentacaoEmMassa({
        ...body,
        usuarioId: user.sub,
      });

      return reply.status(201).send(result);
    } catch (err: any) {
      if (err.message.includes('CONCURRENCY_ERROR')) {
        return reply.status(409).send({ error: err.message });
      }
      return reply.status(400).send({ error: err.message });
    }
  }

  async rastrear(req: FastifyRequest, reply: FastifyReply) {
    const { equipamentoId } = req.params as { equipamentoId: string };
    const result = await this.service.obterRastreabilidade(equipamentoId);
    return reply.send(result);
  }
}