import { Entidade } from "./entidade";
import { Validavel } from "./validavel";
import { RegraDeNegocioError } from "./erros";

export class Contrato extends Entidade implements Validavel {
  public id: string;
  public organizacaoId: string;
  public dataInicio: string;
  public dataFim: string;
  public termos: string;

  constructor(
    id: string,
    organizacaoId: string,
    dataInicio: string,
    dataFim: string,
    termos: string,
    criadoEm?: string
  ) {
    super(criadoEm);
    this.id = id;
    this.organizacaoId = organizacaoId;
    this.dataInicio = dataInicio;
    this.dataFim = dataFim;
    this.termos = termos;
  }

  public validar(): boolean {
    const inicio = new Date(this.dataInicio).getTime();
    const fim = new Date(this.dataFim).getTime();

    if (isNaN(inicio) || isNaN(fim)) {
      throw new RegraDeNegocioError("Datas do contrato em formato inválido.");
    }
    if (fim <= inicio) {
      throw new RegraDeNegocioError("A data de término do contrato deve ser posterior à data de início.");
    }
    return true;
  }

  public regras(): string[] {
    return ["Data final deve ser posterior à data inicial", "Datas devem ser válidas"];
  }

  public resumo(): string {
    return `Contrato ${this.id} (Org: ${this.organizacaoId}) - Vigência: ${this.dataInicio} até ${this.dataFim}`;
  }

  public static deJSON(dados: any, _index?: number): Contrato {
    return new Contrato(
      dados.id,
      dados.organizacaoId,
      dados.dataInicio,
      dados.dataFim,
      dados.termos,
      dados.criadoEm
    );
  }
}