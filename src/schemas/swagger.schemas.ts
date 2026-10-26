import { z } from 'zod';
import { StatusEquipamento, StatusLote } from '@prisma/client';

export const schemaTipoOrg = z
  .enum(["gerador", "operador_logistico", "desmontadora", "comprador"])
  .describe("Tipo de atuação da organização parceira");
export type TipoOrganizacao = z.infer<typeof schemaTipoOrg>;

export const schemaStatusLote = z.nativeEnum(StatusLote).describe("Status atual de processamento do lote");
export const schemaStatusEquipamento = z.nativeEnum(StatusEquipamento).describe("Status do ciclo de vida do equipamento");

export const erroSchema = z.object({
  error: z.string().describe("Mensagem descritiva do erro"),
  detalhes: z.array(z.object({
    campo: z.string().optional().describe("Nome do campo com erro"),
    mensagem: z.string().optional().describe("Detalhamento da regra violada")
  })).optional().describe("Detalhamento dos erros de validação do payload"),
});

export const contratoResumoSchema = z.object({
  id: z.string().uuid().describe("ID único do contrato"),
  numeroContrato: z.string().describe("Identificador do contrato (ex: CTR-2026-001)"),
  vigenciaInicio: z.string().or(z.date()).describe("Data de início da vigência"),
  vigenciaFim: z.string().or(z.date()).describe("Data de término da vigência"),
});

export const loteResumoSchema = z.object({
  id: z.string().uuid().describe("ID único do lote"),
  codigo: z.string().describe("Código do lote (ex: LOT-2026-001)"),
  status: schemaStatusLote,
  dataRecebimento: z.string().or(z.date()).describe("Data de recebimento"),
});

export const organizacaoSchema = z.object({
  id: z.string().uuid().describe("ID único da organização"),
  nome: z.string().describe("Razão Social ou Nome Fantasia"),
  cnpj: z.string().describe("CNPJ sem pontuação (14 dígitos)"),
  tipo: schemaTipoOrg,
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
  contrato: contratoResumoSchema.nullable().optional(),
  lotes: z.array(loteResumoSchema).optional(),
});

export const contratoSchema = z.object({
  id: z.string().uuid().describe("ID único do contrato"),
  numeroContrato: z.string().describe("Número de identificação do contrato"),
  clausulas: z.record(z.unknown()).nullable().optional().describe("Objeto JSON com metas e cláusulas contratuais"),
  vigenciaInicio: z.string().or(z.date()).describe("Início da vigência"),
  vigenciaFim: z.string().or(z.date()).describe("Fim da vigência"),
  organizacaoId: z.string().uuid().describe("ID da organização parceira vinculada"),
  createdAt: z.string().or(z.date()).optional(),
  organizacao: organizacaoSchema.optional(),
});

export const movimentacaoSchema = z.object({
  id: z.string().uuid().describe("ID único da movimentação"),
  dataHora: z.string().or(z.date()).describe("Carimbo de data/hora do registro"),
  equipamentoId: z.string().uuid().describe("ID do equipamento rastreado"),
  usuarioId: z.string().uuid().describe("ID do operador que registrou a alteração"),
  statusAnterior: schemaStatusEquipamento,
  statusNovo: schemaStatusEquipamento,
  observacao: z.string().nullable().optional().describe("Observações técnicas opcionais"),
});

export const equipamentoSchema = z.object({
  id: z.string().uuid().describe("ID único do equipamento"),
  codigoBarrasInterno: z.string().describe("Código de barras ou número de série do equipamento"),
  tipo: z.string().describe("Categoria do e-lixo (ex: Notebook, Monitor, Servidor)"),
  status: schemaStatusEquipamento,
  version: z.number().int().min(0).describe("Versão incremental para controle de concorrência (Bloqueio Otimista / OCC)"),
  loteId: z.string().uuid().describe("ID do lote ao qual o equipamento pertence"),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
  movimentacoes: z.array(movimentacaoSchema).optional(),
});

export const loteSchema = z.object({
  id: z.string().uuid().describe("ID único do lote"),
  codigo: z.string().describe("Código de identificação do lote"),
  status: schemaStatusLote,
  dataRecebimento: z.string().or(z.date()).describe("Data de chegada"),
  organizacaoId: z.string().uuid().describe("ID da organização de origem"),
  createdAt: z.string().or(z.date()).optional(),
  organizacao: organizacaoSchema.optional(),
  equipamentos: z.array(equipamentoSchema).optional(),
  _count: z.object({ equipamentos: z.number() }).optional(),
});