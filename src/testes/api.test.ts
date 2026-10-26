import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('GreenCode API - Suíte de Testes e Regras de Negócio', () => {
    let app: FastifyInstance;
    let tokenAdmin: string;
    let tokenOperador: string;

    beforeAll(async () => {
        app = await buildApp();
        await app.ready();

        // Login do ADMIN
        const resAdmin = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'admin@greencode.com', senha: 'admin123' },
        });
        expect(resAdmin.statusCode).toBe(200);
        tokenAdmin = resAdmin.json().token;
        expect(tokenAdmin).toBeDefined();

        // Login do OPERADOR
        const resOperador = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'operador@greencode.com', senha: 'operador123' },
        });
        expect(resOperador.statusCode).toBe(200);
        tokenOperador = resOperador.json().token;
        expect(tokenOperador).toBeDefined();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /health deve responder com 200 e status ok', async () => {
        const res = await app.inject({ method: 'GET', url: '/health' });
        expect(res.statusCode).toBe(200);
        expect(res.json()).toHaveProperty('status', 'ok');
    });

    it('RBAC (403): OPERADOR não deve conseguir apagar usuários', async () => {
        const res = await app.inject({
            method: 'DELETE',
            url: '/usuarios/00000000-0000-0000-0000-000000000000',
            headers: { authorization: `Bearer ${tokenOperador}` },
        });
        expect(res.statusCode).toBe(403);
    });

    it('FSM (422): Não deve permitir saltar do status RECEBIDO diretamente para DESCARTE', async () => {
        // Busca lista de equipamentos
        const equipRes = await app.inject({
            method: 'GET',
            url: '/equipamentos',
            headers: { authorization: `Bearer ${tokenAdmin}` },
        });
        expect(equipRes.statusCode).toBe(200);
        const equipamento = equipRes.json().data[0];

        const res = await app.inject({
            method: 'POST',
            url: '/movimentacoes',
            headers: { authorization: `Bearer ${tokenAdmin}` },
            payload: {
                equipamentoId: equipamento.id,
                statusNovo: 'DESCARTE',
                version: equipamento.version,
            },
        });

        expect(res.statusCode).toBe(422);
        expect(res.json().error).toContain('Transição de status inválida');
    });

    it('Bloqueio Otimista (409): Deve falhar ao informar versão incompatível', async () => {
        const equipRes = await app.inject({
            method: 'GET',
            url: '/equipamentos',
            headers: { authorization: `Bearer ${tokenAdmin}` },
        });
        const equipamento = equipRes.json().data[0];

        const res = await app.inject({
            method: 'POST',
            url: '/movimentacoes',
            headers: { authorization: `Bearer ${tokenAdmin}` },
            payload: {
                equipamentoId: equipamento.id,
                statusNovo: 'EM_DESMONTAGEM', // Transição válida na FSM
                version: equipamento.version + 99, // Versão errada para provocar o 409
            },
        });

        expect(res.statusCode).toBe(409);
        expect(res.json().error).toContain('Conflito de concorrência');
    });
});