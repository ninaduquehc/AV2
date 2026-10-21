import { ContratoRepository } from '../repositories/contrato.repository.js';
import { OrganizacaoRepository } from '../repositories/organizacao.repository.js';

export class ContratoService {
  constructor(
    private repo = new ContratoRepository(),
    private orgRepo = new OrganizacaoRepository()
  ) {}

  async criar(data: { numeroContrato: string; clausulas: any; vigenciaInicio: Date; vigenciaFim: Date; organizacaoId: string }) {
    const org = await this.orgRepo.findById(data.organizacaoId);
    if (!org) throw new Error('Organização vinculada não encontrada.');

    const contratoExistente = await this.repo.findByOrganizacaoId(data.organizacaoId);
    if (contratoExistente) throw new Error('A organização já possui um contrato cadastrado.');

    return this.repo.create(data);
  }

  async buscarPorId(id: string) {
    const contrato = await this.repo.findById(id);
    if (!contrato) throw new Error('Contrato não encontrado.');
    return contrato;
  }

  async listarTodos() {
    return this.repo.findAll();
  }
}