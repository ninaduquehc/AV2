import { PrismaClient, Role, StatusLote, StatusEquipamento } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o seed do banco de dados...');

  // Limpa os dados existentes (ordem respeitando as chaves estrangeiras)
  await prisma.movimentacao.deleteMany();
  await prisma.equipamento.deleteMany();
  await prisma.lote.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.organizacao.deleteMany();
  await prisma.usuario.deleteMany();

  // 1. Criar Usuários
  const senhaHash = await bcrypt.hash('123456', 10);

  const admin = await prisma.usuario.create({
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

  // 2. Criar Organização e Contrato
  const orgTech = await prisma.organizacao.create({
    data: {
      nome: 'TechCorp Soluções S.A.',
      cnpj: '12.345.678/0001-90',
      tipo: 'Empresa Privada',
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

  // 3. Criar Lote com Equipamentos
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
    include: {
      equipamentos: true,
    },
  });

  console.log('✅ Lote e Equipamentos criados!');

  // 4. Registrar Movimentação para o Primeiro Equipamento
  const primeiroEquipamento = lote.equipamentos[0];

  await prisma.movimentacao.create({
    data: {
      statusAnterior: StatusEquipamento.RECEBIDO,
      statusNovo: StatusEquipamento.EM_TRIAGEM,
      observacao: 'Equipamento recebido no centro de triagem e iniciado o processo de testes.',
      equipamentoId: primeiroEquipamento.id,
      usuarioId: operador.id,
    },
  });

  console.log('✅ Movimentação de teste registrada!');
  console.log('🚀 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });