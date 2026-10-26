import { FastifyReply, FastifyRequest } from 'fastify';

// Middleware que verifica se a requisição possui um JWT válido no Header Authorization.
// O formato de erro é { error }, o mesmo declarado nos schemas de resposta das rotas.
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Não autorizado. Token inválido ou ausente.' });
  }
}

// Middleware para autorização baseada em Papéis (RBAC)
export function authorize(allowedRoles: Array<'ADMIN' | 'OPERADOR' | 'CLIENTE'>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userRole = request.user.role;

    if (!allowedRoles.includes(userRole)) {
      return reply.status(403).send({
        error: 'Acesso negado. Você não possui o papel necessário para esta ação.',
      });
    }
  };
}