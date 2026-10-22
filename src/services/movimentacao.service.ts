import { prisma } from '../lib/prisma.js';
import { MovimentacaoRepository } from '../repositories/movimentacao.repository.js';
import { EquipamentoRepository } from '../repositories/equipamento.repository.js';
import { StatusEquipamento } from '@prisma/client';

export class MovimentacaoService {
  constructor(
    private repo = new MovimentacaoRepository(),
    private eqRepo = new EquipamentoRepository()
  ) {}

  // Movimentação individual com $transaction e bloqueio otimista
  async registrarMovimentacao(data: {
    equipamentoId: string;
    usuarioId: string;
    statusNovo: StatusEquipamento;
    observacao?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Busca o equipamento para obter o status atual e a versão
      const equipamento = await tx.equipamento.findUnique({
        where: { id: data.equipamentoId },
      });

      if (!equipamento) {
        throw new Error('Equipamento não encontrado.');
      }

      const statusAnterior = equipamento.status;

      // 2. Atualiza o equipamento com verificação de versão (bloqueio otimista)
      await this.eqRepo.updateWithVersion(
        equipamento.id,
        equipamento.version,
        { status: data.statusNovo },
        tx
      );

      // 3. Regista o histórico de movimentação
      const movimentacao = await tx.movimentacao.create({
        data: {
          dataHora: new Date(),
          equipamentoId: data.equipamentoId,
          usuarioId: data.usuarioId,
          statusAnterior,
          statusNovo: data.statusNovo,
          observacao: data.observacao,
        },
      });

      return movimentacao;
    });
  }

  // Movimentação em massa (Batch) para múltiplos equipamentos
  async registrarMovimentacaoEmMassa(data: {
    equipamentosIds: string[];
    usuarioId: string;
    statusNovo: StatusEquipamento;
    observacao?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const resultados = [];

      for (const id of data.equipamentosIds) {
        const equipamento = await tx.equipamento.findUnique({ where: { id } });
        if (!equipamento) {
          throw new Error(`Equipamento ID ${id} não foi encontrado.`);
        }

        const statusAnterior = equipamento.status;

        // Atualiza a versão e estado
        await this.eqRepo.updateWithVersion(
          equipamento.id,
          equipamento.version,
          { status: data.statusNovo },
          tx
        );

        // Regista a movimentação
        const mov = await tx.movimentacao.create({
          data: {
            dataHora: new Date(),
            equipamentoId: id,
            usuarioId: data.usuarioId,
            statusAnterior,
            statusNovo: data.statusNovo,
            observacao: data.observacao || 'Movimentação em lote/massa',
          },
        });

        resultados.push(mov);
      }

      return resultados;
    });
  }

  async obterRastreabilidade(equipamentoId: string) {
    return this.repo.findByEquipamentoId(equipamentoId);
  }
}