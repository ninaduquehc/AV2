import { MovimentacaoRepository } from '../repositories/movimentacao.repository.js';
import { EquipamentoRepository } from '../repositories/equipamento.repository.js';
import { StatusEquipamento } from '@prisma/client';

export class MovimentacaoService {
  constructor(
    private repo = new MovimentacaoRepository(),
    private eqRepo = new EquipamentoRepository()
  ) {}

  async registrarMovimentacao(data: {
    equipamentoId: string;
    usuarioId: string;
    statusAnterior: StatusEquipamento;
    statusNovo: StatusEquipamento;
    observacao?: string;
  }) {
    const equipamento = await this.eqRepo.findById(data.equipamentoId);
    if (!equipamento) throw new Error('Equipamento não encontrado.');

    return this.repo.create({
      dataHora: new Date(),
      equipamentoId: data.equipamentoId,
      usuarioId: data.usuarioId,
      statusAnterior: data.statusAnterior,
      statusNovo: data.statusNovo,
      observacao: data.observacao,
    });
  }

  async obterRastreabilidade(equipamentoId: string) {
    return this.repo.findByEquipamentoId(equipamentoId);
  }
}