import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

export class MovimentacaoRepository {
  async create(data: Prisma.MovimentacaoUncheckedCreateInput) {
    return prisma.movimentacao.create({ data });
  }

  async findByEquipamentoId(equipamentoId: string) {
    return prisma.movimentacao.findMany({
      where: { equipamentoId },
      orderBy: { dataHora: 'asc' },
    });
  }
}