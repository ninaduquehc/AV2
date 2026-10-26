import { z } from 'zod';
import { StatusEquipamento, StatusLote } from '@prisma/client';

export const schemaTipoOrg = z.enum(["gerador", "operador_logistico", "desmontadora", "comprador"]);
export type TipoOrganizacao = z.infer<typeof schemaTipoOrg>;

export const schemaStatusLote = z.nativeEnum(StatusLote);
export const schemaStatusEquipamento = z.nativeEnum(StatusEquipamento);

export const erroSchema = z.object({
  error: z.string().describe("Mensagem descritiva do erro"),
  detalhes: z.array(z.object({
    campo: z.string().optional(),
    mensagem: z.string().optional()
  })).optional().describe("Detalhamento dos erros de validação"),
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
  nome: z.string(),
  cnpj: z.string(),
  tipo: schemaTipoOrg,
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
  contrato: contratoResumoSchema.nullable().optional(),
  lotes: z.array(loteResumoSchema).optional(),
});

export const contratoSchema = z.object({
  id: z.string().uuid(),
  numeroContrato: z.string(),
  clausulas: z.record(z.unknown()).optional(),
  vigenciaInicio: z.string().or(z.date()),
  vigenciaFim: z.string().or(z.date()),
  organizacaoId: z.string().uuid(),
  createdAt: z.string().or(z.date()).optional(),
  organizacao: organizacaoSchema.optional(),
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

export const equipamentoSchema = z.object({
  id: z.string().uuid(),
  codigoBarrasInterno: z.string(),
  tipo: z.string(),
  status: schemaStatusEquipamento,
  version: z.number().int(),
  loteId: z.string().uuid(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
  movimentacoes: z.array(movimentacaoSchema).optional(),
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