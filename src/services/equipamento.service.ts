import { EquipamentoRepository } from '../repositories/equipamento.repository.js';
import { StatusEquipamento } from '@prisma/client';
import { LoteRepository } from '../repositories/lote.repository.js';

export class EquipamentoService {
  constructor(
    private repo = new EquipamentoRepository(),
    private loteRepo = new LoteRepository()
  ) {}

  async criar(data: { codigoBarrasInterno: string; tipo: string; status: StatusEquipamento; loteId: string }) {
    const lote = await this.loteRepo.findById(data.loteId);
    if (!lote) throw new Error('Lote especificado não encontrado.');

    const existe = await this.repo.findByCodigoBarras(data.codigoBarrasInterno);
    if (existe) throw new Error('Código de barras já cadastrado.');

    return this.repo.create(data);
  }

  async buscarPorId(id: string) {
    const eq = await this.repo.findById(id);
    if (!eq) throw new Error('Equipamento não encontrado.');
    return eq;
  }

  async listarPaginado(params: { status?: StatusEquipamento; page?: number; limit?: number }) {
    return this.repo.findAll(params);
  }
}