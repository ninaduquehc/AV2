import * as crypto from "crypto";
import { Repositorio } from "../persistence/repositorio.js";
import { Movimentacao } from "../models/movimentacao.js";
import { ARQ_MOVIMENTACOES } from "../config/caminhos.js";
import { logger } from "../utils/logger.js";
import { EstadoFisico, StatusEquipamento } from "../models/equipamento.js";

const repo = new Repositorio<Movimentacao>(ARQ_MOVIMENTACOES);

export function registrarMovimentacao(
  equipamentoId: string,
  usuario: string,
  statusAnterior: StatusEquipamento,
  statusNovo: StatusEquipamento,
  estadoAnterior: EstadoFisico,
  estadoNovo: EstadoFisico,
  justificativa?: string | null
): void {
  const lista = repo.carregar().map((m) => Movimentacao.deJSON(m));
  const id = `MOV-${crypto.randomUUID()}`;

  const justificativaTratada = justificativa || undefined;

  const novaMovimentacao = new Movimentacao(
    id,
    equipamentoId,
    usuario,
    statusAnterior,
    statusNovo,
    estadoAnterior,
    estadoNovo,
    justificativaTratada
  );

  lista.push(novaMovimentacao);
  repo.salvar(lista);
}

export function listarMovimentacoesPorEquipamento(equipamentoId: string): void {
  const lista = repo.carregar().map((m) => Movimentacao.deJSON(m));
  const filtradas = lista.filter((m) => m.equipamentoId === equipamentoId);

  if (filtradas.length === 0) {
    logger.aviso(`Nenhuma movimentação encontrada para o equipamento '${equipamentoId}'.`);
    return;
  }

  console.log(`\n=== HISTÓRICO DE MOVIMENTAÇÕES DO EQUIPAMENTO ${equipamentoId} ===`);
  console.table(filtradas);
}