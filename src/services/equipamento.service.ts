import { EquipamentoRepository } from '../repositories/equipamento.repository.js';
import { StatusEquipamento } from '@prisma/client';
import { LoteRepository } from '../repositories/lote.repository.js';
import { AppError } from '../models/erros.js';

export class EquipamentoService {
  constructor(
    private repo = new EquipamentoRepository(),
    private loteRepo = new LoteRepository()
  ) {}

  async criar(data: {
    codigoBarrasInterno: string;
    tipo: string;
    loteId: string;
  }) {
    const lote = await this.loteRepo.findById(data.loteId);
    if (!lote) throw new AppError('Lote especificado não encontrado.', 404);

    const existe = await this.repo.findByCodigoBarras(data.codigoBarrasInterno);
    if (existe) throw new AppError('Código de barras já cadastrado.', 409);

    return this.repo.create({
      codigoBarrasInterno: data.codigoBarrasInterno,
      tipo: data.tipo,
      status: StatusEquipamento.RECEBIDO,
      loteId: data.loteId,
    });
  }

  async buscarPorId(id: string) {
    const eq = await this.repo.findById(id);
    if (!eq) throw new AppError('Equipamento não encontrado.', 404);
    return eq;
  }

  async listarPaginado(params: { status?: StatusEquipamento; page?: number; limit?: number }) {
    return this.repo.findAll(params);
  }

  async atualizar(id: string, data: { tipo?: string }) {
    await this.buscarPorId(id);
    return this.repo.update(id, data);
  }

  async remover(id: string) {
    const eq = await this.buscarPorId(id);

    if (eq.status !== StatusEquipamento.RECEBIDO || (eq.movimentacoes && eq.movimentacoes.length > 0)) {
      throw new AppError('Só é possível remover equipamentos com status RECEBIDO e sem movimentações registradas.', 409);
    }

    return this.repo.delete(id);
  }
}