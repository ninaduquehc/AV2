import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

export class ContratoRepository {
  async create(data: Prisma.ContratoUncheckedCreateInput) {
    return prisma.contrato.create({ data });
  }

  async findById(id: string) {
    return prisma.contrato.findUnique({
      where: { id },
      include: { organizacao: true },
    });
  }

  async findByNumero(numeroContrato: string) {
    return prisma.contrato.findUnique({ where: { numeroContrato } });
  }

  async findByOrganizacaoId(organizacaoId: string) {
    return prisma.contrato.findFirst({ where: { organizacaoId } });
  }

  async findAll() {
    return prisma.contrato.findMany({ include: { organizacao: true } });
  }
}