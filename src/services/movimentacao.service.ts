import { StatusEquipamento } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../models/erros.js';

export class MovimentacaoService {
  async movimentar(
    equipamentoId: string,
    statusNovo: StatusEquipamento,
    version: number,
    usuarioId: string,
    observacao?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const equipamento = await tx.equipamento.findUnique({
        where: { id: equipamentoId },
      });

      if (!equipamento) {
        throw new AppError('Equipamento não encontrado.', 404);
      }

      if (equipamento.status === statusNovo) {
        throw new AppError(`O equipamento já se encontra no status ${statusNovo}.`, 422);
      }

      // Bloqueio otimista estrito via updateMany com checagem condicional
      const resultado = await tx.equipamento.updateMany({
        where: {
          id: equipamentoId,
          version: version,
        },
        data: {
          status: statusNovo,
          version: { increment: 1 },
        },
      });

      if (resultado.count === 0) {
        throw new AppError(
          'Conflito de concorrência: o equipamento foi modificado por outro usuário ou a versão informada é inválida.',
          409
        );
      }

      const movimentacao = await tx.movimentacao.create({
        data: {
          equipamentoId,
          usuarioId,
          statusAnterior: equipamento.status,
          statusNovo,
          observacao,
        },
      });

      return movimentacao;
    });
  }

  async movimentarEmMassa(
    itens: Array<{ equipamentoId: string; version: number }>,
    statusNovo: StatusEquipamento,
    usuarioId: string,
    observacao?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const movimentacoes = [];

      for (const item of itens) {
        const equipamento = await tx.equipamento.findUnique({
          where: { id: item.equipamentoId },
        });

        if (!equipamento) {
          throw new AppError(`Equipamento ${item.equipamentoId} não encontrado.`, 404);
        }

        if (equipamento.status === statusNovo) {
          throw new AppError(
            `O equipamento ${equipamento.codigoBarrasInterno} já está no status ${statusNovo}.`,
            422
          );
        }

        const resultado = await tx.equipamento.updateMany({
          where: {
            id: item.equipamentoId,
            version: item.version,
          },
          data: {
            status: statusNovo,
            version: { increment: 1 },
          },
        });

        if (resultado.count === 0) {
          throw new AppError(
            `Conflito de concorrência no equipamento ${equipamento.codigoBarrasInterno}.`,
            409
          );
        }

        const mov = await tx.movimentacao.create({
          data: {
            equipamentoId: item.equipamentoId,
            usuarioId,
            statusAnterior: equipamento.status,
            statusNovo,
            observacao,
          },
        });

        movimentacoes.push(mov);
      }

      return movimentacoes;
    });
  }

  async rastrear(equipamentoId: string) {
    const equipamento = await prisma.equipamento.findUnique({
      where: { id: equipamentoId },
    });

    if (!equipamento) {
      throw new AppError('Equipamento não encontrado.', 404);
    }

    return prisma.movimentacao.findMany({
      where: { equipamentoId },
      orderBy: { dataHora: 'asc' },
    });
  }
}