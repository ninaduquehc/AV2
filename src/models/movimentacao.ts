import { Entidade } from "./entidade";
import { EstadoFisico, StatusEquipamento } from "./equipamento";

export class Movimentacao extends Entidade {
  public id: string;
  public equipamentoId: string;
  public usuario: string;
  public statusAnterior: StatusEquipamento;
  public statusNovo: StatusEquipamento;
  public estadoAnterior: EstadoFisico;
  public estadoNovo: EstadoFisico;
  public justificativa?: string;

  constructor(
    id: string,
    equipamentoId: string,
    usuario: string,
    statusAnterior: StatusEquipamento,
    statusNovo: StatusEquipamento,
    estadoAnterior: EstadoFisico,
    estadoNovo: EstadoFisico,
    justificativa?: string,
    criadoEm?: string
  ) {
    super(criadoEm);
    this.id = id;
    this.equipamentoId = equipamentoId;
    this.usuario = usuario;
    this.statusAnterior = statusAnterior;
    this.statusNovo = statusNovo;
    this.estadoAnterior = estadoAnterior;
    this.estadoNovo = estadoNovo;
    this.justificativa = justificativa;
  }

  public regras(): string[] {
    return ["Movimentação imutável de auditoria"];
  }

  public resumo(): string {
    return `Movimentação ${this.id} - Eq: ${this.equipamentoId} por ${this.usuario}`;
  }

  public static deJSON(dados: any, _index?: number): Movimentacao {
    return new Movimentacao(
      dados.id,
      dados.equipamentoId,
      dados.usuario,
      dados.statusAnterior,
      dados.statusNovo,
      dados.estadoAnterior,
      dados.estadoNovo,
      dados.justificativa,
      dados.criadoEm
    );
  }
}