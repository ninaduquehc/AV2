import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { responderErro } from '../utils/http.js';
import { AppError } from '../models/erros.js';

// Hash Bcrypt válido de 60 caracteres para manter o tempo de computação idêntico
const HASH_FALSO = '$2b$10$e81q.B5A/c0aA1v3eG1qU.M8S8mO413YqKkP.8S6m1h4g049j86G';

export class AuthController {
  async login(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { email, senha } = req.body as { email: string; senha: string };
      const emailNormalizado = email.trim().toLowerCase();

      const usuario = await prisma.usuario.findUnique({
        where: { email: emailNormalizado },
      });

      const hashParaComparar = usuario ? usuario.senha : HASH_FALSO;
      const senhaValida = await bcrypt.compare(senha, hashParaComparar);

      if (!usuario || !senhaValida) {
        throw new AppError('E-mail ou senha inválidos.', 401);
      }

      const token = req.server.jwt.sign(
        {
          sub: usuario.id,
          role: usuario.role,
        },
        {
          expiresIn: '8h',
        }
      );

      return reply.send({
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
        },
      });
    } catch (err) {
      return responderErro(reply, err);
    }
  }
}