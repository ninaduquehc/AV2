import { FastifyReply } from 'fastify';
import { AppError } from '../models/erros.js';

// Converte qualquer erro em resposta HTTP.
// Erros conhecidos (AppError) mantêm status e mensagem;
// erros inesperados viram 500 sem expor detalhes internos.
export function responderErro(reply: FastifyReply, err: unknown) {
  if (err instanceof AppError) {
    return reply.status(err.statusCode).send({ error: err.message });
  }

  if (err instanceof Error && err.message.includes('CONCURRENCY_ERROR')) {
    return reply.status(409).send({ error: err.message });
  }

  reply.log.error(err);
  return reply.status(500).send({ error: 'Erro interno do servidor.' });
}