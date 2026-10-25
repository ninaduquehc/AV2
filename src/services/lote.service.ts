import { LoteRepository } from '../repositories/lote.repository.js';
import { OrganizacaoRepository } from '../repositories/organizacao.repository.js';
import { StatusLote } from '@prisma/client';
import { AppError } from '../models/erros.js';

export class LoteService {
  constructor(
    private repo = new LoteRepository(),
    private orgRepo = new OrganizacaoRepository()
  ) {}

  async criar(data: { codigo: string; dataRecebimento?: Date; status: StatusLote; organizacaoId: string }) {
    const org = await this.orgRepo.findById(data.organizacaoId);
    if (!org) throw new AppError('Organização de origem não encontrada.', 404);

    return this.repo.create({
      codigo: data.codigo,
      dataRecebimento: data.dataRecebimento || new Date(),
      status: data.status,
      organizacaoId: data.organizacaoId,
    });
  }

  async buscarPorId(id: string) {
    const lote = await this.repo.findById(id);
    if (!lote) throw new AppError('Lote não encontrado.', 404);
    return lote;
  }

  async listarTodos() {
    return this.repo.findAll();
  }
}