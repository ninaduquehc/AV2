import { PrismaClient, Role, StatusLote, StatusEquipamento, TipoOrganizacao } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ERRO DE SEGURANÇA: O comando de seed não pode ser executado em ambiente de PRODUÇÃO!');
  }

  // Limpeza em ordem respeitando Restrict
  await prisma.movimentacao.deleteMany();
  await prisma.equipamento.deleteMany();
  await prisma.lote.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.organizacao.deleteMany();
  await prisma.usuario.deleteMany();

  // 1. Usuários
  const senhaAdmin = await bcrypt.hash('admin123', 10);
  const senhaOperador = await bcrypt.hash('operador123', 10);

  const admin = await prisma.usuario.create({
    data: {
      nome: 'Administrador GreenCode',
      email: 'admin@greencode.com',
      senha: senhaAdmin,
      role: Role.ADMIN,
    },
  });

  const operador = await prisma.usuario.create({
    data: {
      nome: 'Operador Logístico',
      email: 'operador@greencode.com',
      senha: senhaOperador,
      role: Role.OPERADOR,
    },
  });

  // 2. Organizações (Gerador, Operador Logístico, Desmontadora, Comprador)
  const orgGeradora = await prisma.organizacao.create({
    data: {
      nome: 'Tech Solutions SA',
      cnpj: '11222333000181',
      tipo: TipoOrganizacao.gerador,
    },
  });

  const orgDesmontadora = await prisma.organizacao.create({
    data: {
      nome: 'ReciclaTech Desmontagem LTDA',
      cnpj: '43722216000185',
      tipo: TipoOrganizacao.desmontadora,
    },
  });

  // 3. Contratos e Cláusulas com Cálculos Financeiros
  await prisma.contrato.create({
    data: {
      numeroContrato: 'CTR-2026-001',
      vigenciaInicio: new Date('2026-01-01'),
      vigenciaFim: new Date('2026-12-31'),
      organizacaoId: orgGeradora.id,
      clausulas: {
        valorBaseMensal: 15000.00,
        tarifaPorKgResíduo: 4.50,
        metaReciclagemPorcentagem: 95,
        multaDescumprimentoPercentual: 5.0,
      },
    },
  });

  // 4. Lotes em Status Diferentes
  const lote1 = await prisma.lote.create({
    data: {
      codigo: 'LOT-2026-001',
      status: StatusLote.EM_TRIAGEM,
      organizacaoId: orgGeradora.id,
    },
  });

  const lote2 = await prisma.lote.create({
    data: {
      codigo: 'LOT-2026-002',
      status: StatusLote.PROCESSADO,
      organizacaoId: orgDesmontadora.id,
    },
  });

  // 5. Equipamentos em Vários Estágios da FSM
  const eq1 = await prisma.equipamento.create({
    data: {
      codigoBarrasInterno: 'EQP-100001',
      tipo: 'Notebook',
      status: StatusEquipamento.EM_TRIAGEM,
      version: 1,
      loteId: lote1.id,
    },
  });

  const eq2 = await prisma.equipamento.create({
    data: {
      codigoBarrasInterno: 'EQP-100002',
      tipo: 'Monitor LED',
      status: StatusEquipamento.RECEBIDO,
      version: 0,
      loteId: lote1.id,
    },
  });

  const eq3 = await prisma.equipamento.create({
    data: {
      codigoBarrasInterno: 'EQP-200001',
      tipo: 'Servidor Rack',
      status: StatusEquipamento.REUSO,
      version: 3,
      loteId: lote2.id,
    },
  });

  // 6. Rastreabilidade de Movimentações
  await prisma.movimentacao.createMany({
    data: [
      {
        equipamentoId: eq1.id,
        usuarioId: admin.id,
        statusAnterior: StatusEquipamento.RECEBIDO,
        statusNovo: StatusEquipamento.EM_TRIAGEM,
        observacao: 'Triagem iniciada na esteira 1.',
      },
      {
        equipamentoId: eq3.id,
        usuarioId: operador.id,
        statusAnterior: StatusEquipamento.RECEBIDO,
        statusNovo: StatusEquipamento.EM_TRIAGEM,
        observacao: 'Início da inspeção de servidores.',
      },
      {
        equipamentoId: eq3.id,
        usuarioId: operador.id,
        statusAnterior: StatusEquipamento.EM_TRIAGEM,
        statusNovo: StatusEquipamento.PRONTO_REUSO,
        observacao: 'Aprovado em testes de bancada.',
      },
      {
        equipamentoId: eq3.id,
        usuarioId: admin.id,
        statusAnterior: StatusEquipamento.PRONTO_REUSO,
        statusNovo: StatusEquipamento.REUSO,
        observacao: 'Encaminhado para doação/revenda.',
      },
    ],
  });

  console.log('Seed representativo concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });