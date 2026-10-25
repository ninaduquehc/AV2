import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';

export async function loginController(request: FastifyRequest, reply: FastifyReply) {
  const { email, senha } = request.body as { email?: string; senha?: string };

  if (!email || !senha) {
    return reply.status(400).send({ message: 'E-mail e senha são obrigatórios.' });
  }

  // 1. Busca o usuário no banco
  const usuario = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!usuario) {
    return reply.status(401).send({ message: 'Credenciais inválidas.' });
  }

  // 2. Compara a senha informada com o Hash do banco
  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    return reply.status(401).send({ message: 'Credenciais inválidas.' });
  }

  // 3. Gera o Token JWT contendo o ID (sub) e a Role
  const token = await reply.jwtSign(
    { role: usuario.role },
    { sign: { sub: usuario.id, expiresIn: '8h' } }
  );

  return reply.status(200).send({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
    },
  });
}