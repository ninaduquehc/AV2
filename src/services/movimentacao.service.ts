import { StatusEquipamento, StatusLote, Movimentacao } from '@prisma/client';
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

      await this.sincronizarStatusLote(tx, equipamento.loteId);

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
      const ids = itens.map((i) => i.equipamentoId);
      const equipamentos = await tx.equipamento.findMany({
        where: { id: { in: ids } },
      });

      if (equipamentos.length !== itens.length) {
        throw new AppError('Um ou mais equipamentos informados não foram encontrados.', 404);
      }

      const equipMap = new Map(equipamentos.map((e) => [e.id, e]));
      // Tipagem explícita para evitar o erro de TS (Variable 'movimentacoes' implicitly has 'any[]' type)
      const movimentacoes: Movimentacao[] = [];
      const lotesParaSincronizar = new Set<string>();

      for (const item of itens) {
        const equip = equipMap.get(item.equipamentoId)!;

        if (equip.status === statusNovo) {
          throw new AppError(`O equipamento ${equip.codigoBarrasInterno} já está no status ${statusNovo}.`, 422);
        }

        const res = await tx.equipamento.updateMany({
          where: { id: item.equipamentoId, version: item.version },
          data: { status: statusNovo, version: { increment: 1 } },
        });

        if (res.count === 0) {
          throw new AppError(`Conflito de concorrência no equipamento ${equip.codigoBarrasInterno}.`, 409);
        }

        const mov = await tx.movimentacao.create({
          data: {
            equipamentoId: item.equipamentoId,
            usuarioId,
            statusAnterior: equip.status,
            statusNovo,
            observacao,
          },
        });

        movimentacoes.push(mov);
        lotesParaSincronizar.add(equip.loteId);
      }

      for (const loteId of lotesParaSincronizar) {
        await this.sincronizarStatusLote(tx, loteId);
      }

      return movimentacoes;
    });
  }

  private async sincronizarStatusLote(tx: any, loteId: string) {
    const equipamentos = await tx.equipamento.findMany({
      where: { loteId },
      select: { status: true },
    });

    if (equipamentos.length === 0) return;

    const todosEmTriagem = equipamentos.every((e: { status: StatusEquipamento }) => e.status !== StatusEquipamento.RECEBIDO);

    if (todosEmTriagem) {
      await tx.lote.update({ where: { id: loteId }, data: { status: StatusLote.EM_TRIAGEM } });
    }
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