import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '@prisma/client';
import { AppError } from '../models/erros.js';
import { responderErro } from '../utils/http.js';

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch (_err) {
    return responderErro(reply, new AppError('Token de autenticação ausente ou inválido.', 401));
  }
}

export function authorize(rolesPermitidas: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = req.user as { role: Role };

      if (!user || !rolesPermitidas.includes(user.role)) {
        throw new AppError('Acesso negado: seu perfil não possui permissão para esta operação.', 403);
      }
    } catch (err) {
      return responderErro(reply, err);
    }
  };
}