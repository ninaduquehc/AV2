import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

export class OrganizacaoRepository {
  async create(data: Prisma.OrganizacaoCreateInput) {
    return prisma.organizacao.create({ data });
  }

  async findById(id: string) {
    return prisma.organizacao.findUnique({
      where: { id },
      include: { contrato: true, lotes: true },
    });
  }

  async findByCnpj(cnpj: string) {
    return prisma.organizacao.findUnique({ where: { cnpj } });
  }

  async findAll() {
    return prisma.organizacao.findMany({
      include: { contrato: true },
    });
  }

  async update(id: string, data: Prisma.OrganizacaoUpdateInput) {
    return prisma.organizacao.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.organizacao.delete({ where: { id } });
  }
}