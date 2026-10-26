import { FastifyReply, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../models/erros.js';

type DetalheValidacao = { campo: string; mensagem: string };

function extrairDetalhesValidacao(err: unknown): DetalheValidacao[] | null {
  if (err instanceof ZodError) {
    return err.errors.map((e) => ({
      campo: e.path.join('.') || 'campo',
      mensagem: e.message,
    }));
  }

  if (err && typeof err === 'object') {
    const e = err as { statusCode?: number; validation?: unknown; issues?: unknown };
    if (e.statusCode !== 400) return null;

    const lista = Array.isArray(e.validation)
      ? e.validation
      : Array.isArray(e.issues)
        ? e.issues
        : null;

    if (lista && lista.length > 0) {
      return lista.map((v: any) => ({
        campo: Array.isArray(v.path)
          ? v.path.join('.')
          : v.instancePath?.replace(/^\//, '') || v.params?.missingProperty || 'campo',
        mensagem: v.message || 'Valor inválido',
      }));
    }
  }

  return null;
}

export function responderErro(reply: FastifyReply, err: unknown) {
  if (err instanceof AppError) {
    return reply.status(err.statusCode).send({ error: err.message });
  }

  const detalhes = extrairDetalhesValidacao(err);
  if (detalhes) {
    return reply.status(400).send({
      error: 'Erro de validação dos dados enviados.',
      detalhes,
    });
  }

  // Outros erros 4xx com statusCode (ex: 429 do rate limit)
  if (err && typeof err === 'object' && 'statusCode' in err && typeof (err as { statusCode: unknown }).statusCode === 'number') {
    const errorObj = err as { statusCode: number; message?: string };
    if (errorObj.statusCode >= 400 && errorObj.statusCode < 500) {
      return reply.status(errorObj.statusCode).send({
        error: errorObj.message || 'Erro de requisição inválida.',
      });
    }
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