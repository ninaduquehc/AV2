import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

export class UsuarioRepository {
  async create(data: Prisma.UsuarioCreateInput) {
    return prisma.usuario.create({
      data,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.usuario.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findAll() {
    return prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string) {
    return prisma.usuario.delete({ where: { id } });
  }
}