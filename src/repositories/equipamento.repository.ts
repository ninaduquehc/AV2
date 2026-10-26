import { prisma } from '../lib/prisma.js';
import { Prisma, StatusEquipamento } from '@prisma/client';
import { ConflitoDeVersaoError } from '../models/erros.js';

export class EquipamentoRepository {
  async create(data: Prisma.EquipamentoUncheckedCreateInput) {
    return prisma.equipamento.create({ data });
  }

  async findById(id: string) {
    return prisma.equipamento.findUnique({
      where: { id },
      include: { lote: true, movimentacoes: true },
    });
  }

  async findByCodigoBarras(codigoBarrasInterno: string) {
    return prisma.equipamento.findUnique({ where: { codigoBarrasInterno } });
  }

  async findAll(params?: { status?: StatusEquipamento; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where = params?.status ? { status: params.status } : {};

    const [total, data] = await Promise.all([
      prisma.equipamento.count({ where }),
      prisma.equipamento.findMany({
        where,
        skip,
        take: limit,
        include: { lote: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return { total, page, limit, totalPages: Math.ceil(total / limit), data };
  }

  async update(id: string, data: Prisma.EquipamentoUncheckedUpdateInput) {
    return prisma.equipamento.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.equipamento.delete({ where: { id } });
  }

  // Atualização com bloqueio otimista lançando ConflitoDeVersaoError
  async updateWithVersion(
    id: string,
    currentVersion: number,
    data: Prisma.EquipamentoUpdateInput,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || prisma;

    const updated = await client.equipamento.updateMany({
      where: {
        id,
        version: currentVersion,
      },
      data: {
        ...data,
        version: {
          increment: 1,
        },
      },
    });

    if (updated.count === 0) {
      throw new ConflitoDeVersaoError();
    }

    return client.equipamento.findUnique({ where: { id } });
  }
}