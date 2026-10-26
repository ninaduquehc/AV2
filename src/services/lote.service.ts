import { LoteRepository } from '../repositories/lote.repository.js';
import { OrganizacaoRepository } from '../repositories/organizacao.repository.js';
import { StatusLote, StatusEquipamento } from '@prisma/client';
import { AppError } from '../models/erros.js';
import { prisma } from '../lib/prisma.js';

export class LoteService {
  constructor(
    private repo = new LoteRepository(),
    private orgRepo = new OrganizacaoRepository()
  ) {}

  async criar(data: {
    codigo: string;
    dataRecebimento?: Date;
    organizacaoId: string;
    equipamentos?: Array<{ codigoBarrasInterno: string; tipo: string }>;
  }) {
    const org = await this.orgRepo.findById(data.organizacaoId);
    if (!org) throw new AppError('Organização de origem não encontrada.', 404);

    const equipamentosParaCriar = data.equipamentos;

    if (equipamentosParaCriar && equipamentosParaCriar.length > 0) {
      return prisma.$transaction(async (tx) => {
        const loteCriado = await tx.lote.create({
          data: {
            codigo: data.codigo,
            dataRecebimento: data.dataRecebimento || new Date(),
            status: StatusLote.RECEBIDO,
            organizacaoId: data.organizacaoId,
          },
        });

        for (const eq of equipamentosParaCriar) {
          const existe = await tx.equipamento.findUnique({
            where: { codigoBarrasInterno: eq.codigoBarrasInterno },
          });

          if (existe) {
            throw new AppError(`Código de barras '${eq.codigoBarrasInterno}' já está cadastrado.`, 409);
          }

          await tx.equipamento.create({
            data: {
              codigoBarrasInterno: eq.codigoBarrasInterno,
              tipo: eq.tipo,
              status: StatusEquipamento.RECEBIDO,
              loteId: loteCriado.id,
            },
          });
        }

        return tx.lote.findUnique({
          where: { id: loteCriado.id },
          include: { equipamentos: true, organizacao: true },
        });
      });
    }

    return this.repo.create({
      codigo: data.codigo,
      dataRecebimento: data.dataRecebimento || new Date(),
      status: StatusLote.RECEBIDO,
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

  async atualizar(id: string, data: { codigo?: string; dataRecebimento?: Date }) {
    const lote = await this.buscarPorId(id);
    if (lote.status === StatusLote.CANCELADO) {
      throw new AppError('Não é possível alterar dados de um lote cancelado.', 422);
    }
    return this.repo.update(id, data);
  }

  async remover(id: string) {
    const lote = await this.buscarPorId(id);
    if (lote.equipamentos && lote.equipamentos.length > 0) {
      throw new AppError('Não é possível remover um lote que possui equipamentos vinculados.', 409);
    }
    return this.repo.delete(id);
  }
}