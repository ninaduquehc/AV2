-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERADOR', 'CLIENTE');

-- CreateEnum
CREATE TYPE "StatusLote" AS ENUM ('RECEBIDO', 'EM_TRIAGEM', 'PROCESSADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusEquipamento" AS ENUM ('RECEBIDO', 'EM_TRIAGEM', 'EM_DESMONTAGEM', 'TESTE_COMPONENTES', 'PRONTO_DESCARTE', 'PRONTO_REUSO', 'DESCARTE', 'REUSO');

-- CreateEnum
CREATE TYPE "TipoOrganizacao" AS ENUM ('gerador', 'operador_logistico', 'desmontadora', 'comprador');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizacoes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "tipo" "TipoOrganizacao" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "numeroContrato" TEXT NOT NULL,
    "clausulas" JSONB,
    "vigenciaInicio" TIMESTAMP(3) NOT NULL,
    "vigenciaFim" TIMESTAMP(3) NOT NULL,
    "organizacaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "status" "StatusLote" NOT NULL DEFAULT 'RECEBIDO',
    "dataRecebimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizacaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" TEXT NOT NULL,
    "codigoBarrasInterno" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" "StatusEquipamento" NOT NULL DEFAULT 'RECEBIDO',
    "version" INTEGER NOT NULL DEFAULT 0,
    "loteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes" (
    "id" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "equipamentoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "statusAnterior" "StatusEquipamento" NOT NULL,
    "statusNovo" "StatusEquipamento" NOT NULL,
    "observacao" TEXT,

    CONSTRAINT "movimentacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizacoes_cnpj_key" ON "organizacoes"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_numeroContrato_key" ON "contratos"("numeroContrato");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_organizacaoId_key" ON "contratos"("organizacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_codigo_key" ON "lotes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_codigoBarrasInterno_key" ON "equipamentos"("codigoBarrasInterno");

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "organizacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "organizacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "equipamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
