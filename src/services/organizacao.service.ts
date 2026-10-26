import { prisma } from '../lib/prisma.js';
import { AppError } from '../models/erros.js';
import { TipoOrganizacao } from '../schemas/swagger.schemas.js';

export class OrganizacaoService {
  async create(data: { nome: string; cnpj: string; tipo: TipoOrganizacao }) {
    const existente = await prisma.organizacao.findUnique({
      where: { cnpj: data.cnpj },
    });

    if (existente) {
      throw new AppError('Já existe uma organização cadastrada com este CNPJ.', 409);
    }

    return prisma.organizacao.create({ data });
  }

  async findAll() {
    return prisma.organizacao.findMany({
      include: { contrato: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: string) {
    const org = await prisma.organizacao.findUnique({
      where: { id },
      include: { contrato: true, lotes: true },
    });

    if (!org) {
      throw new AppError('Organização não encontrada.', 404);
    }

    return org;
  }

  async update(id: string, data: { nome?: string; cnpj?: string; tipo?: TipoOrganizacao }) {
    await this.findById(id);

    if (data.cnpj) {
      const existente = await prisma.organizacao.findFirst({
        where: { cnpj: data.cnpj, NOT: { id } },
      });
      if (existente) {
        throw new AppError('Já existe outra organização utilizando este CNPJ.', 409);
      }
    }

    return prisma.organizacao.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const org = await this.findById(id);

    if (org.contrato || org.lotes.length > 0) {
      throw new AppError('Não é possível remover organizações que possuem contratos ou lotes vinculados.', 409);
    }

    await prisma.organizacao.delete({ where: { id } });
  }
}