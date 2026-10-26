import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '@prisma/client';
import { UsuarioService } from '../services/usuario.service.js';
import { responderErro } from '../utils/http.js';

export class UsuarioController {
  constructor(private service = new UsuarioService()) {}

  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as { nome: string; email: string; senha: string; role?: Role };
      const usuario = await this.service.criar(body);
      return reply.status(201).send(usuario);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async index(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const usuarios = await this.service.listarTodos();
      return reply.send(usuarios);
    } catch (err) {
      return responderErro(reply, err);
    }
  }

  async delete(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const usuarioLogadoId = req.user?.sub;

      await this.service.remover(id, usuarioLogadoId);
      return reply.status(204).send();
    } catch (err) {
      return responderErro(reply, err);
    }
  }
}