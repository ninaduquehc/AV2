import * as crypto from "crypto";
import { Repositorio } from "../persistence/repositorio";
import { Equipamento, EstadoFisico, HIERARQUIA_ESTADO } from "../models/equipamento";
import { Movimentacao } from "../models/movimentacao";
import { FabricaEntidades } from "../models/fabrica";
import { ARQ_EQUIPAMENTOS, ARQ_MOVIMENTACOES } from "../config/caminhos";
import { log } from "../utils/logger";
import { registrarTransacao } from "../persistence/journal";
import { RegraDeNegocioError } from "../models/erros";

const repoEq = new Repositorio<Equipamento>(ARQ_EQUIPAMENTOS);
const repoMov = new Repositorio<Movimentacao>(ARQ_MOVIMENTACOES);

function novoIdMovimentacao(): string {
  return `MOV-${crypto.randomUUID()}`;
}

export function executarEquipamentos(subAcao: string, opcoes: Record<string, string>, ctx: { usuario: string }): void {
  if (subAcao === "criar") {
    const id = opcoes["id"]; // opcional: se ausente, a fábrica gera o código de barras
    const lote = opcoes["lote"];
    const tipo = opcoes["tipo"];
    const modelo = opcoes["modelo"];
    const estado = (opcoes["estado"] || "B_BOM") as EstadoFisico;

    if (!lote || !tipo || !modelo) {
      log.erro("Uso: equipamento criar --lote <LOTE_ID> --tipo <TIPO> --modelo <MODELO> [--id COD_BARRAS] [--estado ESTADO]");
      return;
    }

    const lista = repoEq.carregar();
    if (id && lista.some((e) => e.id === id)) {
      log.erro("Já existe um equipamento cadastrado com esse código de barras.");
      return;
    }

    const eq = FabricaEntidades.criarEquipamento(id, lote, tipo, modelo, estado);
    const novaLista = [...lista.map((item) => Equipamento.deJSON(item)), eq];
    repoEq.salvar(novaLista);

    registrarTransacao(ctx.usuario, "cadastrar_equipamento", { id: eq.id, loteId: lote });
    log.sucesso(`Equipamento '${eq.id}' cadastrado com sucesso.`);
  } else if (subAcao === "triar") {
    const id = opcoes["id"];
    if (!id) {
      log.erro("Uso: equipamento triar --id <COD_BARRAS>");
      return;
    }

    const lista = repoEq.carregar().map((e) => Equipamento.deJSON(e));
    const eq = lista.find((e) => e.id === id);
    if (!eq) {
      log.erro("Equipamento não encontrado.");
      return;
    }

    eq.triagemConcluida = true;
    eq.status = "triado";
    repoEq.salvar(lista);

    registrarTransacao(ctx.usuario, "concluir_triagem", { id: eq.id });
    log.sucesso(`Triagem do equipamento '${eq.id}' concluída com sucesso.`);
  } else if (subAcao === "desmonte") {
    const id = opcoes["id"];
    if (!id) {
      log.erro("Uso: equipamento desmonte --id <COD_BARRAS>");
      return;
    }

    const lista = repoEq.carregar().map((e) => Equipamento.deJSON(e));
    const eq = lista.find((e) => e.id === id);
    if (!eq) {
      log.erro("Equipamento não encontrado.");
      return;
    }

    if (!eq.triagemConcluida) {
      throw new RegraDeNegocioError("Um equipamento só pode ser movido para o status de 'desmonte' após passar por triagem completa.");
    }

    const statusAnterior = eq.status;
    eq.status = "em_desmonte";
    repoEq.salvar(lista);

    const movs = repoMov.carregar().map((m) => Movimentacao.deJSON(m));
    movs.push(new Movimentacao(novoIdMovimentacao(), eq.id, ctx.usuario, statusAnterior, "em_desmonte", eq.estadoFisico, eq.estadoFisico));
    repoMov.salvar(movs);

    registrarTransacao(ctx.usuario, "mover_desmonte", { id: eq.id });
    log.sucesso(`Equipamento '${eq.id}' movido para desmonte.`);
  } else if (subAcao === "estado") {
    const id = opcoes["id"];
    const novoEstado = opcoes["novo"] as EstadoFisico;
    const justificativa = opcoes["justificativa"];

    if (!id || !novoEstado) {
      log.erro("Uso: equipamento estado --id <COD_BARRAS> --novo <NOVO_ESTADO> [--justificativa TEXTO]");
      return;
    }

    const lista = repoEq.carregar().map((e) => Equipamento.deJSON(e));
    const eq = lista.find((e) => e.id === id);
    if (!eq) {
      log.erro("Equipamento não encontrado.");
      return;
    }

    const nivelAntigo = HIERARQUIA_ESTADO[eq.estadoFisico];
    const nivelNovo = HIERARQUIA_ESTADO[novoEstado];

    if (nivelAntigo - nivelNovo >= 2 && (!justificativa || justificativa.trim().length === 0)) {
      throw new RegraDeNegocioError("Obrigatoriedade de justificativa textual sempre que o estado físico for alterado para duas ou mais categorias abaixo.");
    }

    const estadoAnterior = eq.estadoFisico;
    eq.estadoFisico = novoEstado;
    repoEq.salvar(lista);

    const movs = repoMov.carregar().map((m) => Movimentacao.deJSON(m));
    movs.push(new Movimentacao(novoIdMovimentacao(), eq.id, ctx.usuario, eq.status, eq.status, estadoAnterior, novoEstado, justificativa));
    repoMov.salvar(movs);

    registrarTransacao(ctx.usuario, "alterar_estado", { id: eq.id, de: estadoAnterior, para: novoEstado });
    log.sucesso(`Estado físico do equipamento '${eq.id}' alterado para ${novoEstado}.`);
  }
}