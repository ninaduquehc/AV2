import { StatusEquipamento, StatusLote, Movimentacao, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../models/erros.js';

const TRANSICOES: Record<StatusEquipamento, StatusEquipamento[]> = {
  [StatusEquipamento.RECEBIDO]: [StatusEquipamento.EM_TRIAGEM],
  [StatusEquipamento.EM_TRIAGEM]: [StatusEquipamento.EM_DESMONTAGEM, StatusEquipamento.PRONTO_REUSO],
  [StatusEquipamento.EM_DESMONTAGEM]: [StatusEquipamento.TESTE_COMPONENTES],
  [StatusEquipamento.TESTE_COMPONENTES]: [StatusEquipamento.PRONTO_REUSO, StatusEquipamento.PRONTO_DESCARTE],
  [StatusEquipamento.PRONTO_REUSO]: [StatusEquipamento.REUSO],
  [StatusEquipamento.PRONTO_DESCARTE]: [StatusEquipamento.DESCARTE],
  [StatusEquipamento.REUSO]: [],
  [StatusEquipamento.DESCARTE]: [],
};

export class MovimentacaoService {
  private validarTransicao(statusAtual: StatusEquipamento, statusNovo: StatusEquipamento) {
    if (statusAtual === statusNovo) {
      throw new AppError(`O equipamento já se encontra no status ${statusNovo}.`, 422);
    }

    const permitidos = TRANSICOES[statusAtual] || [];
    if (!permitidos.includes(statusNovo)) {
      throw new AppError(
        `Transição de status inválida: de ${statusAtual} para ${statusNovo}. Transições permitidas a partir de ${statusAtual}: [${permitidos.join(', ')}]`,
        422
      );
    }
  }

  async movimentar(
    equipamentoId: string,
    statusNovo: StatusEquipamento,
    version: number,
    usuarioId: string,
    observacao?: string
  ) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const equipamento = await tx.equipamento.findUnique({
        where: { id: equipamentoId },
        include: { lote: true },
      });

      if (!equipamento) {
        throw new AppError('Equipamento não encontrado.', 404);
      }

      if (equipamento.lote.status === StatusLote.CANCELADO) {
        throw new AppError('Não é possível movimentar equipamentos de um lote cancelado.', 422);
      }

      this.validarTransicao(equipamento.status, statusNovo);

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
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const ids = itens.map((i) => i.equipamentoId);
      const equipamentos = await tx.equipamento.findMany({
        where: { id: { in: ids } },
        include: { lote: true },
      });

      if (equipamentos.length !== itens.length) {
        throw new AppError('Um ou mais equipamentos informados não foram encontrados.', 404);
      }

      for (const eq of equipamentos) {
        if (eq.lote.status === StatusLote.CANCELADO) {
          throw new AppError(`O equipamento ${eq.codigoBarrasInterno} pertence a um lote cancelado.`, 422);
        }
      }

      const equipMap = new Map(equipamentos.map((e) => [e.id, e]));
      const movimentacoes: Movimentacao[] = [];
      const lotesParaSincronizar = new Set<string>();

      for (const item of itens) {
        const equip = equipMap.get(item.equipamentoId)!;

        this.validarTransicao(equip.status, statusNovo);

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

  private async sincronizarStatusLote(tx: Prisma.TransactionClient, loteId: string) {
    const lote = await tx.lote.findUnique({ where: { id: loteId }, select: { status: true } });
    if (!lote || lote.status === StatusLote.CANCELADO) return;

    const equipamentos = await tx.equipamento.findMany({
      where: { loteId },
      select: { status: true },
    });

    if (equipamentos.length === 0) return;

    const todosFinalizados = equipamentos.every(
      (e) => e.status === StatusEquipamento.DESCARTE || e.status === StatusEquipamento.REUSO
    );
    const algumEmAndamento = equipamentos.some(
      (e) => e.status !== StatusEquipamento.RECEBIDO
    );

    if (todosFinalizados) {
      await tx.lote.update({ where: { id: loteId }, data: { status: StatusLote.PROCESSADO } });
    } else if (algumEmAndamento) {
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