import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { responderErro } from '../utils/http.js';
import { AppError } from '../models/erros.js';

// Hash bcrypt de exemplo para balanceamento de tempo de CPU
const HASH_FALSO = '$2b$10$wK1V.B5A/c0aA1v3eG1qU.M8S8mO413YqKkP.8S6m1h4g049j86G';

export class AuthController {
  async login(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { email, senha } = req.body as {
        email: string;
        senha: string;
      };

      const emailNormalizado = email.trim().toLowerCase();

      const usuario = await prisma.usuario.findUnique({
        where: { email: emailNormalizado },
      });

      // Executa bcrypt.compare obrigatoriamente para evitar ataque de tempo
      const hashParaComparar = usuario ? usuario.senha : HASH_FALSO;
      const senhaValida = await bcrypt.compare(senha, hashParaComparar);

      if (!usuario || !senhaValida) {
        throw new AppError('E-mail ou senha inválidos.', 401);
      }

      // Payload enxuto com expiração padrão de 8 horas
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