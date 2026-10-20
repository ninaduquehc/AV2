export abstract class Entidade {
  public abstract id: string;
  public criadoEm: string;

  constructor(criadoEmExistente?: string) {
    this.criadoEm = criadoEmExistente || new Date().toISOString();
  }

  public abstract regras(): string[];
  public abstract resumo(): string;
}