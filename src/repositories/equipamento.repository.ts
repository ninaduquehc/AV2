import { prisma } from '../lib/prisma.js';
import { Prisma, StatusEquipamento } from '@prisma/client';

export class EquipamentoRepository {
    async create(data: Prisma.EquipamentoUncheckedCreateInput) {
        return prisma.equipamento.create({ data });
    }

    async findById(id: string) {
        return prisma.equipamento.findUnique({
            where: { id },
            include: { lote: true, movimentacoes: true },
        });
    }

    async findByCodigoBarras(codigoBarrasInterno: string) {
        return prisma.equipamento.findUnique({ where: { codigoBarrasInterno } });
    }

    async findAll(params?: { status?: StatusEquipamento; page?: number; limit?: number }) {
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const skip = (page - 1) * limit;

        const where = params?.status ? { status: params.status } : {};

        const [total, data] = await Promise.all([
            prisma.equipamento.count({ where }),
            prisma.equipamento.findMany({
                where,
                skip,
                take: limit,
                include: { lote: true },
                orderBy: { updatedAt: 'desc' },
            }),
        ]);

        return { total, page, limit, totalPages: Math.ceil(total / limit), data };
    }

    // Atualização com bloqueio otimista
    async updateWithVersion(
        id: string,
        currentVersion: number,
        data: Prisma.EquipamentoUpdateInput,
        tx?: Prisma.TransactionClient // Suporte para transações externas
    ) {
        const client = tx || prisma;

        // Executa a atualização garantindo que o ID e a VERSÃO coincidem
        const updated = await client.equipamento.updateMany({
            where: {
                id,
                version: currentVersion,
            },
            data: {
                ...data,
                version: {
                    increment: 1, // Incrementa a versão automaticamente
                },
            },
        });

        // Se count for 0, significa que o equipamento foi alterado por outro processo simultaneamente
        if (updated.count === 0) {
            throw new Error('CONCURRENCY_ERROR: O equipamento foi modificado por outro utilizador/processo. Tente novamente.');
        }

        return client.equipamento.findUnique({ where: { id } });
    }
}