import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { UsuarioRepository } from '../repositories/usuario.repository.js';
import { responderErro } from '../utils/http.js';
import { AppError } from '../models/erros.js';

const HASH_FALSO = bcrypt.hashSync('senha-descartavel-timing', 10);

export class AuthController {
  constructor(private repo = new UsuarioRepository()) {}

  async login(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { email, senha } = req.body as { email: string; senha: string };
      const emailNormalizado = email.trim().toLowerCase();

      const usuario = await this.repo.findByEmail(emailNormalizado);

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