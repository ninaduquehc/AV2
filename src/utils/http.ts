import { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';
import { AppError, RegraDeNegocioError } from '../models/erros.js';

type ErroDeValidacao = {
  instancePath?: string;
  message?: string;
};

// Tratador central de erros da API (registrado com app.setErrorHandler em app.ts).
// Todo erro lançado em controller, service ou repository passa por aqui, e a resposta
// sempre tem o formato { error: string, detalhes?: [{ campo, mensagem }] }.
export function tratadorDeErros(erro: unknown, req: FastifyRequest, reply: FastifyReply) {
  // Erros de negócio conhecidos
  if (erro instanceof AppError) {
    return reply.status(erro.statusCode).send({ error: erro.message });
  }

  if (erro instanceof RegraDeNegocioError) {
    return reply.status(422).send({ error: erro.message });
  }

  // Compatibilidade com o erro de bloqueio otimista antigo (repositório ainda lançando Error genérico)
  if (erro instanceof Error && erro.message.includes('CONCURRENCY_ERROR')) {
    return reply.status(409).send({ error: erro.message });
  }

  // Erros do banco que escapam das checagens do service (ex.: duas requisições simultâneas)
  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    if (erro.code === 'P2002') {
      const campos = (erro.meta?.target as string[] | undefined)?.join(', ');
      return reply.status(409).send({
        error: campos ? `Já existe um registro com este valor (${campos}).` : 'Já existe um registro com este valor.',
      });
    }
    if (erro.code === 'P2003') {
      return reply.status(409).send({
        error: 'Operação não permitida: há registros vinculados ou a referência informada não existe.',
      });
    }
    if (erro.code === 'P2025') {
      return reply.status(404).send({ error: 'Registro não encontrado.' });
    }
  }

  const e = erro as { validation?: ErroDeValidacao[]; statusCode?: number; message?: string };

  // Falha de validação do Zod (body, params ou querystring)
  if (Array.isArray(e.validation)) {
    return reply.status(400).send({
      error: 'Dados inválidos.',
      detalhes: e.validation.map((v) => ({
        campo: (v.instancePath ?? '').replace(/^\//, '') || undefined,
        mensagem: v.message,
      })),
    });
  }

  // Erros do próprio Fastify/plugins (corpo malformado, tipo de conteúdo etc.)
  if (typeof e.statusCode === 'number' && e.statusCode >= 400 && e.statusCode < 500) {
    return reply.status(e.statusCode).send({ error: e.message });
  }

  req.log.error(erro);
  return reply.status(500).send({ error: 'Erro interno do servidor.' });
}

// Mantida para os controllers que ainda usam try/catch: delega ao tratador central.
export function responderErro(reply: FastifyReply, err: unknown) {
  return tratadorDeErros(err, reply.request, reply);
}