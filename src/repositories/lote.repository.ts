import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

export class LoteRepository {
  async create(data: Prisma.LoteUncheckedCreateInput) {
    return prisma.lote.create({ data });
  }

  async findById(id: string) {
    return prisma.lote.findUnique({
      where: { id },
      include: { organizacao: true, equipamentos: true },
    });
  }

  async findAll() {
    return prisma.lote.findMany({
      include: { organizacao: true, _count: { select: { equipamentos: true } } },
    });
  }
}