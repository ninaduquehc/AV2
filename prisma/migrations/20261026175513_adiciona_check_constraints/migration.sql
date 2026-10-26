-- DropForeignKey
ALTER TABLE "movimentacoes" DROP CONSTRAINT "movimentacoes_equipamentoId_fkey";

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "equipamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Garante que a vigência do contrato sempre tenha fim após o início
ALTER TABLE "contratos"
ADD CONSTRAINT "check_vigencia_datas" CHECK ("vigenciaFim" > "vigenciaInicio");

-- Garante que a versão de bloqueio otimista nunca seja negativa
ALTER TABLE "equipamentos"
ADD CONSTRAINT "check_version_nao_negativa" CHECK ("version" >= 0);