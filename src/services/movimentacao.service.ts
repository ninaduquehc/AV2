import { prisma } from '../lib/prisma.js';
import { MovimentacaoRepository } from '../repositories/movimentacao.repository.js';
import { EquipamentoRepository } from '../repositories/equipamento.repository.js';
import { StatusEquipamento } from '@prisma/client';
import { AppError } from '../models/erros.js';

export class MovimentacaoService {
  constructor(
    private repo = new MovimentacaoRepository(),
    private eqRepo = new EquipamentoRepository()
  ) {}

  // Movimentação individual: o cliente envia a versão que viu.
  async registrarMovimentacao(data: {
    equipamentoId: string;
    usuarioId: string;
    statusNovo: StatusEquipamento;
    version: number;
    observacao?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const equipamento = await tx.equipamento.findUnique({
        where: { id: data.equipamentoId },
      });

      if (!equipamento) {
        throw new AppError('Equipamento não encontrado.', 404);
      }

      if (equipamento.status === data.statusNovo) {
        throw new AppError('O equipamento já está neste status.', 422);
      }

      // O update só acontece se a versão enviada ainda for a atual.
      await this.eqRepo.updateWithVersion(
        equipamento.id,
        data.version,
        { status: data.statusNovo },
        tx
      );

      return tx.movimentacao.create({
        data: {
          dataHora: new Date(),
          equipamentoId: data.equipamentoId,
          usuarioId: data.usuarioId,
          statusAnterior: equipamento.status,
          statusNovo: data.statusNovo,
          observacao: data.observacao,
        },
      });
    });
  }

  // Movimentação em massa: cada item traz a versão que o cliente viu.
  // Tudo ou nada: se um item falhar, a transação inteira é desfeita.
  async registrarMovimentacaoEmMassa(data: {
    itens: { equipamentoId: string; version: number }[];
    usuarioId: string;
    statusNovo: StatusEquipamento;
    observacao?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const resultados = [];

      for (const item of data.itens) {
        const equipamento = await tx.equipamento.findUnique({
          where: { id: item.equipamentoId },
        });

        if (!equipamento) {
          throw new AppError(`Equipamento ${item.equipamentoId} não foi encontrado.`, 404);
        }

        if (equipamento.status === data.statusNovo) {
          throw new AppError(`O equipamento ${item.equipamentoId} já está neste status.`, 422);
        }

        await this.eqRepo.updateWithVersion(
          equipamento.id,
          item.version,
          { status: data.statusNovo },
          tx
        );

        const mov = await tx.movimentacao.create({
          data: {
            dataHora: new Date(),
            equipamentoId: item.equipamentoId,
            usuarioId: data.usuarioId,
            statusAnterior: equipamento.status,
            statusNovo: data.statusNovo,
            observacao: data.observacao || 'Movimentação em lote/massa',
          },
        });

        resultados.push(mov);
      }

      return resultados;
    });
  }

  async obterRastreabilidade(equipamentoId: string) {
    const equipamento = await this.eqRepo.findById(equipamentoId);
    if (!equipamento) throw new AppError('Equipamento não encontrado.', 404);
    return this.repo.findByEquipamentoId(equipamentoId);
  }
}