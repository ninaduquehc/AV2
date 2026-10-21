import { OrganizacaoRepository } from '../repositories/organizacao.repository.js';

export class OrganizacaoService {
  constructor(private repo = new OrganizacaoRepository()) {}

  async criar(data: { nome: string; cnpj: string; tipo: string }) {
    const existe = await this.repo.findByCnpj(data.cnpj);
    if (existe) throw new Error('Organização já cadastrada com este CNPJ.');
    return this.repo.create(data);
  }

  async buscarPorId(id: string) {
    const org = await this.repo.findById(id);
    if (!org) throw new Error('Organização não encontrada.');
    return org;
  }

  async listarTodas() {
    return this.repo.findAll();
  }
}