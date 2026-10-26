import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';

// Hash de segurança para tempo de resposta constante
const HASH_FALSO = bcrypt.hashSync('senha-que-nao-existe', 10);

export async function loginController(request: FastifyRequest, reply: FastifyReply) {
  const { email, senha } = request.body as { email: string; senha: string };

  const emailNormalizado = email.trim().toLowerCase();

  // 1. Busca o usuário no banco com o email normalizado
  const usuario = await prisma.usuario.findUnique({
    where: { email: emailNormalizado },
  });

  // 2. Compara a senha informada com o hash do banco
  const senhaValida = await bcrypt.compare(senha, usuario?.senha ?? HASH_FALSO);

  if (!usuario || !senhaValida) {
    return reply.status(401).send({ error: 'Credenciais inválidas.' });
  }

  // 3. Gera o Token JWT
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