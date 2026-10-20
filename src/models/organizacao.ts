import { Entidade } from "./entidade";
import { Validavel } from "./validavel";
import { cnpjValido } from "../utils/cnpj";
import { RegraDeNegocioError } from "./erros";

export type TipoOrganizacao = "gerador" | "operador_logistico" | "desmontadora" | "comprador";

export class Organizacao extends Entidade implements Validavel {
  public id: string;
  public razosocial: string;
  public cnpj: string;
  public tipo: TipoOrganizacao;

  constructor(
    id: string,
    razosocial: string,
    cnpj: string,
    tipo: TipoOrganizacao,
    criadoEm?: string
  ) {
    super(criadoEm);
    this.id = id;
    this.razosocial = razosocial;
    this.cnpj = cnpj;
    this.tipo = tipo;
  }

  public get nome(): string {
    return this.razosocial;
  }

  public validar(): boolean {
    const tiposValidos: TipoOrganizacao[] = ["gerador", "operador_logistico", "desmontadora", "comprador"];
    if (!tiposValidos.includes(this.tipo)) {
      throw new RegraDeNegocioError(`Tipo de organização '${this.tipo}' inválido. Opções: ${tiposValidos.join(", ")}`);
    }

    if (!this.razosocial || this.razosocial.trim().length < 3) {
      throw new RegraDeNegocioError("Razão social deve possuir ao menos 3 caracteres.");
    }

    if (!cnpjValido(this.cnpj)) {
      throw new RegraDeNegocioError(`CNPJ '${this.cnpj}' é inválido.`);
    }

    return true;
  }

  public regras(): string[] {
    return ["CNPJ deve ser válido", "Razão social válida", "Tipo de organização restrito"];
  }

  public resumo(): string {
    return `${this.razosocial} (${this.cnpj}) - ${this.tipo}`;
  }

  public static deJSON(dados: any): Organizacao {
    return new Organizacao(
      dados.id,
      dados.razosocial || dados.razaoSocial || dados.nome,
      dados.cnpj,
      dados.tipo,
      dados.criadoEm
    );
  }
}