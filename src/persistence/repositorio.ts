import { escreverAtomico, lerAtomico } from "./armazenamento";

export class Repositorio<T> {
  constructor(private caminhoArquivo: string) {}

  public carregar(): T[] {
    const conteudo = lerAtomico(this.caminhoArquivo, true);
    if (!conteudo) return [];

    try {
      return JSON.parse(conteudo) as T[];
    } catch {
      throw new Error(`Arquivo '${this.caminhoArquivo}' contém um JSON inválido ou corrompido.`);
    }
  }

  public salvar(dados: T[]): void {
    escreverAtomico(this.caminhoArquivo, JSON.stringify(dados, null, 2), true);
  }
}