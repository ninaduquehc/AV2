import { Entidade } from "./entidade";
import { Validavel } from "./validavel";
import { RegraDeNegocioError } from "./erros";

export class Lote extends Entidade implements Validavel {
  public id: string;
  public organizacaoId: string;
  public notaFiscal: string;
  public transportadora: string;
  public dataEntrada: string;

  constructor(
    id: string,
    organizacaoId: string,
    notaFiscal: string,
    transportadora: string,
    dataEntrada: string,
    criadoEm?: string
  ) {
    super(criadoEm);
    this.id = id;
    this.organizacaoId = organizacaoId;
    this.notaFiscal = notaFiscal;
    this.transportadora = transportadora;
    this.dataEntrada = dataEntrada;
  }

  public validar(): boolean {
    const data = new Date(this.dataEntrada);
    const agora = new Date();

    if (isNaN(data.getTime())) {
      throw new RegraDeNegocioError("Data de entrada do lote inválida.");
    }

    if (data > agora) {
      throw new RegraDeNegocioError("Não é permitido cadastrar lotes com data de entrada futura.");
    }

    const noventaDiasAtras = new Date();
    noventaDiasAtras.setDate(agora.getDate() - 90);

    if (data < noventaDiasAtras) {
      throw new RegraDeNegocioError("Não é permitido cadastrar lotes com data de entrada superior a 90 dias passados.");
    }

    return true;
  }

  public regras(): string[] {
    return ["Data de entrada não pode ser futura", "Data de entrada não pode ter mais de 90 dias"];
  }

  public resumo(): string {
    return `Lote ${this.id} - NF: ${this.notaFiscal} (${this.transportadora})`;
  }

  public static deJSON(dados: any, _index?: number): Lote {
    return new Lote(
      dados.id,
      dados.organizacaoId,
      dados.notaFiscal,
      dados.transportadora,
      dados.dataEntrada,
      dados.criadoEm
    );
  }
}