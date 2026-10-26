import { FastifyReply, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../models/erros.js';

export function responderErro(reply: FastifyReply, err: unknown) {
  if (err instanceof AppError) {
    return reply.status(err.statusCode).send({ error: err.message });
  }

  // Trata erros que vêm com propriedade statusCode customizada (ex: 429 Rate Limit ou validações Fastify)
  if (err && typeof err === 'object' && 'statusCode' in err && typeof (err as { statusCode: unknown }).statusCode === 'number') {
    const errorObj = err as { statusCode: number; message?: string; validation?: any[] };
    if (errorObj.statusCode >= 400 && errorObj.statusCode < 500) {
      const detalhesFormatados = errorObj.validation
        ? errorObj.validation.map((v: any) => ({
            campo: v.instancePath?.replace(/^\//, '') || v.params?.missingProperty || 'campo',
            mensagem: v.message || 'Valor inválido',
          }))
        : undefined;

      return reply.status(errorObj.statusCode).send({
        error: errorObj.message || 'Erro de requisição inválida.',
        detalhes: detalhesFormatados,
      });
    }
  }

  if (err instanceof ZodError) {
    return reply.status(400).send({
      error: 'Erro de validação dos dados enviados.',
      detalhes: err.errors.map((e) => ({
        campo: e.path.join('.'),
        mensagem: e.message,
      })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'campo';
      return reply.status(409).send({
        error: `Conflito de dados: o valor informado para '${target}' já está em uso.`,
      });
    }

    if (err.code === 'P2025') {
      return reply.status(404).send({
        error: 'Registro solicitado não foi encontrado no banco de dados.',
      });
    }

    if (err.code === 'P2003') {
      return reply.status(409).send({
        error: 'Não é possível concluir a operação pois o registro possui vínculo com outros dados.',
      });
    }
  }

  console.error('[ERRO NÃO TRATADO]:', err);
  return reply.status(500).send({ error: 'Erro interno do servidor.' });
}

export function tratadorDeErros(error: FastifyError, _req: unknown, reply: FastifyReply) {
  return responderErro(reply, error);
}