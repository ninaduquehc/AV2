import * as crypto from "crypto";
import { Organizacao, TipoOrganizacao } from "./organizacao.js";
import { Contrato } from "./contrato.js";
import { Lote } from "./lote.js";
import { Equipamento, EstadoFisico } from "./equipamento.js";

export class FabricaEntidades {
  public static criarOrganizacao(razosocial: string, cnpj: string, tipo: TipoOrganizacao): Organizacao {
    const id = `ORG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const org = new Organizacao(id, razosocial, cnpj, tipo);
    org.validar();
    return org;
  }

  public static criarContrato(organizacaoId: string, dataInicio: string, dataFim: string, termos: string): Contrato {
    const id = `CTR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const contrato = new Contrato(id, organizacaoId, dataInicio, dataFim, termos);
    contrato.validar();
    return contrato;
  }

  public static criarLote(organizacaoId: string, notaFiscal: string, transportadora: string, dataEntrada: string): Lote {
    const id = `LOT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const lote = new Lote(id, organizacaoId, notaFiscal, transportadora, dataEntrada);
    lote.validar();
    return lote;
  }

  public static criarEquipamento(
    codigoBarrasCustom: string | undefined,
    loteId: string,
    tipo: string,
    modelo: string,
    estado: EstadoFisico
  ): Equipamento {
    const codigoBarras = codigoBarrasCustom || `EQP-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
    const eq = new Equipamento(codigoBarras, loteId, tipo, modelo, estado);
    eq.validar();
    return eq;
  }
}