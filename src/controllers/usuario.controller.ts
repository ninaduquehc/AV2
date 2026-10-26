import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { responderErro } from '../utils/http.js';
import { AppError } from '../models/erros.js';
import { Role } from '@prisma/client';

export class UsuarioController {
  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { nome, email, senha, role } = req.body as {
        nome: string;
        email: string;
        senha: string;
        role?: Role;
      };

      const emailNormalizado = email.trim().toLowerCase();

      const usuarioExiste = await prisma.usuario.findUnique({
        where: { email: emailNormalizado },
      });

      if (usuarioExiste) {
        throw new AppError('Já existe um usuário cadastrado com este e-mail.', 409);
      }

      const senhaHash = await bcrypt.hash(senha, 10);

      const usuario = await prisma.usuario.create({
        data: {
          nome,
          email: emailNormalizado,
          senha: senhaHash,
          role: role || 'OPERADOR',
        },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return reply.status(201).send(usuario);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async index(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const usuarios = await prisma.usuario.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send(usuarios);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async delete(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      // Regra de segurança: impede auto-exclusão do usuário logado
      if (req.user && req.user.sub === id) {
        throw new AppError('Operação não permitida: você não pode remover seu próprio usuário.', 403);
      }

      const usuario = await prisma.usuario.findUnique({ where: { id } });
      if (!usuario) {
        throw new AppError('Usuário não encontrado.', 404);
      }

      await prisma.usuario.delete({ where: { id } });
      return reply.status(204).send();
    } catch (err) {
      return responderErro(reply, err);
    }
  }
}