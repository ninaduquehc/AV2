import { Repositorio } from "../persistence/repositorio";
import { ARQ_PARAMETROS } from "../config/caminhos";
import { log } from "../utils/logger";
import { registrarTransacao } from "../persistence/journal";

export interface ParametrosGlobais {
  aliquotaImposto: number;
  coeficienteDepreciacao: number;
  atualizadoEm: string;
}

const repo = new Repositorio<ParametrosGlobais>(ARQ_PARAMETROS);

export function executarParametros(opcoes: Record<string, string>, ctx: { usuario: string }): void {
  const aliquota = parseFloat(opcoes["aliquota"]);
  const depreciacao = parseFloat(opcoes["depreciacao"]);

  if (isNaN(aliquota) || isNaN(depreciacao)) {
    log.erro("Uso: parametro definir --aliquota <NUMERO> --depreciacao <NUMERO>");
    return;
  }

  const novosParametros: ParametrosGlobais = {
    aliquotaImposto: aliquota,
    coeficienteDepreciacao: depreciacao,
    atualizadoEm: new Date().toISOString(),
  };

  // Registrar no journal ANTES de salvar a alteração de estado
  registrarTransacao(ctx.usuario, "configurar_parametros", novosParametros);

  repo.salvar([novosParametros]);
  log.sucesso(`Parâmetros globais definidos: Alíquota ${aliquota}% | Depreciação ${depreciacao}%.`);
}

export function visualizarParametros(): void {
  const repo = new Repositorio<ParametrosGlobais>(ARQ_PARAMETROS);
  const atuais = repo.carregar()[0] ?? { aliquotaImposto: 0, coeficienteDepreciacao: 0, atualizadoEm: "—" };
  log.info(`Alíquota de imposto: ${atuais.aliquotaImposto}% | Depreciação: ${atuais.coeficienteDepreciacao}% (atualizado em ${atuais.atualizadoEm})`);
}