import { PrismaClient, Role, StatusLote, StatusEquipamento } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ERRO DE SEGURANÇA: O comando de seed não pode ser executado em ambiente de PRODUÇÃO!');
  }

  await prisma.movimentacao.deleteMany();
  await prisma.equipamento.deleteMany();
  await prisma.lote.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.organizacao.deleteMany();
  await prisma.usuario.deleteMany();

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

  await prisma.usuario.create({
    data: {
      nome: 'Operador Logístico',
      email: 'operador@greencode.com',
      senha: senhaOperador,
      role: Role.OPERADOR,
    },
  });

  const orgGeradora = await prisma.organizacao.create({
    data: {
      nome: 'Tech Solutions SA',
      cnpj: '11222333000181',
      tipo: 'gerador',
    },
  });

  await prisma.contrato.create({
    data: {
      numeroContrato: 'CTR-2026-001',
      vigenciaInicio: new Date('2026-01-01'),
      vigenciaFim: new Date('2026-12-31'),
      organizacaoId: orgGeradora.id,
      clausulas: {
        metaReciclagem: '95%',
        penalidadeAtraso: '0.5% ao dia',
      },
    },
  });

  const lote = await prisma.lote.create({
    data: {
      codigo: 'LOT-2026-001',
      status: StatusLote.RECEBIDO,
      organizacaoId: orgGeradora.id,
    },
  });

  const eq1 = await prisma.equipamento.create({
    data: {
      codigoBarrasInterno: 'EQP-100001',
      tipo: 'Notebook',
      status: StatusEquipamento.EM_TRIAGEM,
      version: 1,
      loteId: lote.id,
    },
  });

  await prisma.movimentacao.create({
    data: {
      equipamentoId: eq1.id,
      usuarioId: admin.id,
      statusAnterior: StatusEquipamento.RECEBIDO,
      statusNovo: StatusEquipamento.EM_TRIAGEM,
      observacao: 'Início da triagem no centro de reciclagem.',
    },
  });

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });