const TEMPO_LIMITE_MS = 30 * 60 * 1000;

let ultimaAtividade: number = Date.now();

export function registrarAtividade(): void {
  ultimaAtividade = Date.now();
}

export function sessaoExpirada(): boolean {
  return Date.now() - ultimaAtividade > TEMPO_LIMITE_MS;
}