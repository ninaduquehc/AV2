import { LoteRepository } from '../repositories/lote.repository.js';
import { OrganizacaoRepository } from '../repositories/organizacao.repository.js';
import { StatusLote } from '@prisma/client';

export class LoteService {
  constructor(
    private repo = new LoteRepository(),
    private orgRepo = new OrganizacaoRepository()
  ) {}

  async criar(data: { codigo: string; dataRecebimento?: Date; status: StatusLote; organizacaoId: string }) {
    const org = await this.orgRepo.findById(data.organizacaoId);
    if (!org) throw new Error('Organização de origem não encontrada.');

    return this.repo.create({
      codigo: data.codigo,
      dataRecebimento: data.dataRecebimento || new Date(),
      status: data.status,
      organizacaoId: data.organizacaoId,
    });
  }

  async buscarPorId(id: string) {
    const lote = await this.repo.findById(id);
    if (!lote) throw new Error('Lote não encontrado.');
    return lote;
  }

  async listarTodos() {
    return this.repo.findAll();
  }
}