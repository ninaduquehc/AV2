import { FastifyRequest, FastifyReply } from 'fastify';
import { MovimentacaoService } from '../services/movimentacao.service.js';

export class MovimentacaoController {
  constructor(private service = new MovimentacaoService()) {}

  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const user = (req as any).user; // Injetado pelo middleware JWT
      const result = await this.service.registrarMovimentacao({
        ...body,
        usuarioId: user.sub,
      });
      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  }

  async rastrear(req: FastifyRequest, reply: FastifyReply) {
    const { equipamentoId } = req.params as { equipamentoId: string };
    const result = await this.service.obterRastreabilidade(equipamentoId);
    return reply.send(result);
  }
}