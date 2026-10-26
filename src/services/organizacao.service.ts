import { OrganizacaoRepository } from '../repositories/organizacao.repository.js';
import { AppError } from '../models/erros.js';

export class OrganizacaoService {
  constructor(private repo = new OrganizacaoRepository()) {}

  async criar(data: { nome: string; cnpj: string; tipo: string }) {
    const existe = await this.repo.findByCnpj(data.cnpj);
    if (existe) throw new AppError('Organização já cadastrada com este CNPJ.', 409);
    return this.repo.create(data);
  }

  async buscarPorId(id: string) {
    const org = await this.repo.findById(id);
    if (!org) throw new AppError('Organização não encontrada.', 404);
    return org;
  }

  async listarTodas() {
    return this.repo.findAll();
  }

  async atualizar(id: string, data: { nome?: string; cnpj?: string; tipo?: string }) {
    await this.buscarPorId(id);

    if (data.cnpj) {
      const outroCnpj = await this.repo.findByCnpj(data.cnpj);
      if (outroCnpj && outroCnpj.id !== id) {
        throw new AppError('Já existe outra organização cadastrada com este CNPJ.', 409);
      }
    }

    return this.repo.update(id, data);
  }

  async remover(id: string) {
    const org = await this.repo.findById(id);
    if (!org) throw new AppError('Organização não encontrada.', 404);

    if ((org.lotes && org.lotes.length > 0) || org.contrato) {
      throw new AppError('Não é possível remover uma organização que possui contratos ou lotes vinculados.', 409);
    }

    return this.repo.delete(id);
  }
}