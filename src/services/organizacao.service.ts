import { OrganizacaoRepository } from '../repositories/organizacao.repository.js';
import { AppError } from '../models/erros.js';
import { TipoOrganizacao } from '../schemas/swagger.schemas.js';

export class OrganizacaoService {
  constructor(private repo = new OrganizacaoRepository()) {}

  async create(data: { nome: string; cnpj: string; tipo: TipoOrganizacao }) {
    const existente = await this.repo.findByCnpj(data.cnpj);

    if (existente) {
      throw new AppError('Já existe uma organização cadastrada com este CNPJ.', 409);
    }

    return this.repo.create(data);
  }

  async findAll() {
    return this.repo.findAll();
  }

  async findById(id: string) {
    const org = await this.repo.findById(id);

    if (!org) {
      throw new AppError('Organização não encontrada.', 404);
    }

    return org;
  }

  async update(id: string, data: { nome?: string; cnpj?: string; tipo?: TipoOrganizacao }) {
    await this.findById(id);

    if (data.cnpj) {
      const existente = await this.repo.findByCnpj(data.cnpj);
      if (existente && existente.id !== id) {
        throw new AppError('Já existe outra organização utilizando este CNPJ.', 409);
      }
    }

    return this.repo.update(id, data);
  }

  async delete(id: string) {
    const org = await this.findById(id);

    if (org.contrato || (org.lotes && org.lotes.length > 0)) {
      throw new AppError('Não é possível remover organizações que possuem contratos ou lotes vinculados.', 409);
    }

    await this.repo.delete(id);
  }
}