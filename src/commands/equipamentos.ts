import * as crypto from "crypto";
import { Repositorio } from "../persistence/repositorio";
import { Equipamento, EstadoFisico, HIERARQUIA_ESTADO } from "../models/equipamento";
import { Movimentacao } from "../models/movimentacao";
import { Lote } from "../models/lote";
import { FabricaEntidades } from "../models/fabrica";
import { ARQ_EQUIPAMENTOS, ARQ_MOVIMENTACOES, ARQ_LOTES } from "../config/caminhos";
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

    if (!new Repositorio<Lote>(ARQ_LOTES).carregar().some((l) => l.id === lote)) {
      log.erro(`Nenhum lote encontrado com o ID '${lote}'.`);
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
  } else if (subAcao === "listar") {
    const lote = opcoes["lote"]?.trim();
    const status = opcoes["status"]?.trim();
    const lista = repoEq
      .carregar()
      .map((e) => Equipamento.deJSON(e))
      .filter((e) => (!lote || e.loteId === lote) && (!status || e.status === status));

    if (lista.length === 0) {
      log.info("Nenhum equipamento encontrado.");
      return;
    }

    console.log("\n--- Equipamentos ---");
    for (const e of lista) {
      console.log(
        `ID: ${e.id} | Lote: ${e.loteId} | ${e.tipo} ${e.modelo} | Estado: ${e.estadoFisico} | Status: ${e.status}`
      );
    }
  } else if (subAcao === "consultar") {
    const id = opcoes["id"]?.trim();
    if (!id) {
      log.erro("Uso: equipamento consultar --id <COD_BARRAS>");
      return;
    }

    const eq = repoEq.carregar().map((e) => Equipamento.deJSON(e)).find((e) => e.id === id);
    if (!eq) {
      log.erro("Equipamento não encontrado.");
      return;
    }

    console.log("\n--- Detalhes do equipamento ---");
    console.log(`Código de barras: ${eq.id}`);
    console.log(`Lote: ${eq.loteId}`);
    console.log(`Tipo: ${eq.tipo}`);
    console.log(`Modelo: ${eq.modelo}`);
    console.log(`Estado físico: ${eq.estadoFisico}`);
    console.log(`Status: ${eq.status}`);
    console.log(`Triagem concluída: ${eq.triagemConcluida ? "Sim" : "Não"}`);
    console.log(`Criado em: ${eq.criadoEm}`);
  } else if (subAcao === "atualizar") {
    const id = opcoes["id"]?.trim();
    const tipo = opcoes["tipo"];
    const modelo = opcoes["modelo"];

    if (!id) {
      log.erro("Uso: equipamento atualizar --id <COD_BARRAS> [--tipo <TIPO>] [--modelo <MODELO>]");
      return;
    }
    if (!tipo && !modelo) {
      log.erro("Informe ao menos um campo para atualizar (--tipo ou --modelo). Estado e status têm comandos próprios.");
      return;
    }

    const lista = repoEq.carregar().map((e) => Equipamento.deJSON(e));
    const indice = lista.findIndex((e) => e.id === id);
    if (indice === -1) {
      log.erro("Equipamento não encontrado.");
      return;
    }

    const atual = lista[indice];
    const atualizado = new Equipamento(
      atual.id,
      atual.loteId,
      tipo ?? atual.tipo,
      modelo ?? atual.modelo,
      atual.estadoFisico,
      atual.status,
      atual.triagemConcluida,
      atual.criadoEm
    );
    atualizado.validar();

    lista[indice] = atualizado;
    repoEq.salvar(lista);

    const campos = [tipo && "tipo", modelo && "modelo"].filter(Boolean);
    registrarTransacao(ctx.usuario, "atualizar_equipamento", { id, campos });
    log.sucesso(`Equipamento '${id}' atualizado com sucesso.`);
  } else if (subAcao === "remover") {
    const id = opcoes["id"]?.trim();
    if (!id) {
      log.erro("Uso: equipamento remover --id <COD_BARRAS>");
      return;
    }

    const lista = repoEq.carregar().map((e) => Equipamento.deJSON(e));
    const eq = lista.find((e) => e.id === id);
    if (!eq) {
      log.erro("Equipamento não encontrado.");
      return;
    }

    // Movimentações são trilha de auditoria imutável: equipamento que já
    // passou por etapas do processo não pode sumir do sistema.
    const temMovimentacoes = repoMov.carregar().some((m) => m.equipamentoId === id);
    if (eq.status !== "recebido" || eq.triagemConcluida || temMovimentacoes) {
      throw new RegraDeNegocioError(
        "Só é possível remover equipamentos com status 'recebido', sem triagem e sem movimentações registradas."
      );
    }

    repoEq.salvar(lista.filter((e) => e.id !== id));

    registrarTransacao(ctx.usuario, "remover_equipamento", { id });
    log.sucesso(`Equipamento '${id}' removido com sucesso.`);
  } else {
    log.erro("Ação inválida. Use: equipamento criar | listar | consultar | atualizar | remover | triar | desmonte | estado.");
  }
}
