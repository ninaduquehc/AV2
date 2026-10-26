import { ContratoRepository } from '../repositories/contrato.repository.js';
import { OrganizacaoRepository } from '../repositories/organizacao.repository.js';
import { AppError } from '../models/erros.js';

export class ContratoService {
  constructor(
    private repo = new ContratoRepository(),
    private orgRepo = new OrganizacaoRepository()
  ) {}

  async criar(data: { numeroContrato: string; clausulas?: any; vigenciaInicio: Date; vigenciaFim: Date; organizacaoId: string }) {
    if (data.vigenciaFim <= data.vigenciaInicio) {
      throw new AppError('A data de término do contrato deve ser posterior à data de início.', 422);
    }

    const org = await this.orgRepo.findById(data.organizacaoId);
    if (!org) throw new AppError('Organização vinculada não encontrada.', 404);

    const contratoExistente = await this.repo.findByOrganizacaoId(data.organizacaoId);
    if (contratoExistente) throw new AppError('A organização já possui um contrato cadastrado.', 409);

    const numeroEmUso = await this.repo.findByNumero(data.numeroContrato);
    if (numeroEmUso) throw new AppError('Já existe um contrato com este número.', 409);

    return this.repo.create({
      ...data,
      clausulas: data.clausulas ?? {},
    });
  }

  async buscarPorId(id: string) {
    const contrato = await this.repo.findById(id);
    if (!contrato) throw new AppError('Contrato não encontrado.', 404);
    return contrato;
  }

  async listarTodos() {
    return this.repo.findAll();
  }

  async atualizar(id: string, data: { numeroContrato?: string; clausulas?: any; vigenciaInicio?: Date; vigenciaFim?: Date }) {
    const atual = await this.buscarPorId(id);

    const inicio = data.vigenciaInicio || atual.vigenciaInicio;
    const fim = data.vigenciaFim || atual.vigenciaFim;

    if (fim <= inicio) {
      throw new AppError('A data de término do contrato deve ser posterior à data de início.', 422);
    }

    return this.repo.update(id, data);
  }

  async remover(id: string) {
    await this.buscarPorId(id);
    return this.repo.delete(id);
  }

  // Método de Cálculo Financeiro do Contrato
  async calcularEstimativaFaturamento(id: string, pesoTotalKg: number) {
    const contrato = await this.buscarPorId(id);
    const clausulas = (contrato.clausulas as Record<string, number>) || {};

    const valorBase = clausulas.valorBaseMensal || 0;
    const tarifaPorKg = clausulas.tarifaPorKgResíduo || 0;

    const valorVariavel = pesoTotalKg * tarifaPorKg;
    const totalEstimado = valorBase + valorVariavel;

    return {
      contratoId: contrato.id,
      numeroContrato: contrato.numeroContrato,
      pesoTotalKg,
      valorBase,
      tarifaPorKg,
      valorVariavel,
      totalEstimado,
    };
  }
}