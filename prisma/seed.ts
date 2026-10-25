import 'dotenv/config';
import { PrismaClient, Role, StatusLote, StatusEquipamento } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed recusado: ele apaga todos os dados e não pode rodar em produção.');
  }

  const senhaSeed = process.env.SEED_PASSWORD;
  if (!senhaSeed || senhaSeed.length < 8) {
    throw new Error('Defina SEED_PASSWORD (mín. 8 caracteres) no arquivo .env antes de rodar o seed.');
  }

  console.log('🌱 Iniciando o seed do banco de dados...');

  // Limpa os dados existentes (ordem respeitando as chaves estrangeiras)
  await prisma.movimentacao.deleteMany();
  await prisma.equipamento.deleteMany();
  await prisma.lote.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.organizacao.deleteMany();
  await prisma.usuario.deleteMany();

  const senhaHash = await bcrypt.hash(senhaSeed, 10);

  await prisma.usuario.create({
    data: {
      nome: 'Administrador GreenCode',
      email: 'admin@greencode.com',
      senha: senhaHash,
      role: Role.ADMIN,
    },
  });

  const operador = await prisma.usuario.create({
    data: {
      nome: 'Operador de Triagem',
      email: 'operador@greencode.com',
      senha: senhaHash,
      role: Role.OPERADOR,
    },
  });

  console.log('✅ Usuários criados com sucesso!');

  const orgTech = await prisma.organizacao.create({
    data: {
      nome: 'TechCorp Soluções S.A.',
      cnpj: '12345678000190',
      tipo: 'gerador',
      contrato: {
        create: {
          numeroContrato: 'CT-2026-001',
          clausulas: { reciclagemMinima: '80%', prazoDias: 30 },
          vigenciaInicio: new Date('2026-01-01'),
          vigenciaFim: new Date('2026-12-31'),
        },
      },
    },
  });

  console.log('✅ Organização e Contrato criados!');

  const lote = await prisma.lote.create({
    data: {
      codigo: 'LOTE-2026-001',
      status: StatusLote.EM_TRIAGEM,
      organizacaoId: orgTech.id,
      equipamentos: {
        create: [
          {
            codigoBarrasInterno: 'EQ-NOTE-001',
            tipo: 'Notebook',
            status: StatusEquipamento.EM_TRIAGEM,
            version: 1,
          },
          {
            codigoBarrasInterno: 'EQ-DESK-002',
            tipo: 'Desktop',
            status: StatusEquipamento.RECEBIDO,
            version: 1,
          },
        ],
      },
    },
    include: { equipamentos: true },
  });

  console.log('✅ Lote e Equipamentos criados!');

  await prisma.movimentacao.create({
    data: {
      statusAnterior: StatusEquipamento.RECEBIDO,
      statusNovo: StatusEquipamento.EM_TRIAGEM,
      observacao: 'Equipamento recebido no centro de triagem e iniciado o processo de testes.',
      equipamentoId: lote.equipamentos[0].id,
      usuarioId: operador.id,
    },
  });

  console.log('✅ Movimentação de teste registrada!');
  console.log('🚀 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });