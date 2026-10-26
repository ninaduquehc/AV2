import { z } from 'zod';
import { StatusEquipamento, StatusLote } from '@prisma/client';

export const schemaTipoOrg = z.enum(["gerador", "operador_logistico", "desmontadora", "comprador"]);
export const schemaStatusLote = z.nativeEnum(StatusLote);
export const schemaStatusEquipamento = z.nativeEnum(StatusEquipamento);

export const erroSchema = z.object({
  error: z.string().describe("Mensagem descritiva do erro"),
  detalhes: z.array(z.object({
    campo: z.string().optional(),
    mensagem: z.string().optional()
  })).optional().describe("Detalhamento dos erros de validação ou campo"),
});

export const contratoResumoSchema = z.object({
  id: z.string().uuid(),
  numeroContrato: z.string(),
  vigenciaInicio: z.string().or(z.date()),
  vigenciaFim: z.string().or(z.date()),
});

export const loteResumoSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string(),
  status: schemaStatusLote,
  dataRecebimento: z.string().or(z.date()),
});

export const organizacaoSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().describe("Razão social da empresa"),
  cnpj: z.string().describe("CNPJ formatado sem pontuação"),
  tipo: schemaTipoOrg.describe("Tipo de atuação na cadeia de e-lixo"),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
  contrato: contratoResumoSchema.nullable().optional(),
  lotes: z.array(loteResumoSchema).optional(),
});

export const contratoSchema = z.object({
  id: z.string().uuid(),
  numeroContrato: z.string().describe("Identificador único do contrato"),
  clausulas: z.record(z.unknown()).optional().describe("Objeto JSON com cláusulas e metas"),
  vigenciaInicio: z.string().or(z.date()),
  vigenciaFim: z.string().or(z.date()),
  organizacaoId: z.string().uuid(),
  createdAt: z.string().or(z.date()).optional(),
  organizacao: organizacaoSchema.optional(),
});

export const equipamentoSchema = z.object({
  id: z.string().uuid(),
  codigoBarrasInterno: z.string().describe("Código de identificação física do item"),
  tipo: z.string().describe("Tipo de equipamento e-lixo (ex: Notebook, Monitor)"),
  status: schemaStatusEquipamento,
  version: z.number().int().describe("Versão incremental para bloqueio otimista"),
  loteId: z.string().uuid(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export const loteSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string(),
  status: schemaStatusLote,
  dataRecebimento: z.string().or(z.date()),
  organizacaoId: z.string().uuid(),
  createdAt: z.string().or(z.date()).optional(),
  organizacao: organizacaoSchema.optional(),
  equipamentos: z.array(equipamentoSchema).optional(),
  _count: z.object({ equipamentos: z.number() }).optional(),
});

export const movimentacaoSchema = z.object({
  id: z.string().uuid(),
  dataHora: z.string().or(z.date()),
  equipamentoId: z.string().uuid(),
  usuarioId: z.string().uuid(),
  statusAnterior: schemaStatusEquipamento,
  statusNovo: schemaStatusEquipamento,
  observacao: z.string().nullable().optional(),
});