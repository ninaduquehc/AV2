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

  async update(id: string, data: Prisma.LoteUncheckedUpdateInput) {
    return prisma.lote.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.lote.delete({ where: { id } });
  }
}