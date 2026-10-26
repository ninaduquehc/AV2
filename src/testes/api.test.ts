import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('GreenCode API - Suíte Completa de Testes e Regras de Negócio', () => {
  let app: FastifyInstance;
  let tokenAdmin: string;
  let tokenOperador: string;
  let organizacaoId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const resAdmin = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'admin@greencode.com', senha: 'admin123' },
    });
    tokenAdmin = resAdmin.json().token;

    const resOperador = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'operador@greencode.com', senha: 'operador123' },
    });
    tokenOperador = resOperador.json().token;

    const orgsRes = await app.inject({
      method: 'GET',
      url: '/organizacoes',
      headers: { authorization: `Bearer ${tokenAdmin}` },
    });
    organizacaoId = orgsRes.json()[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health deve responder com 200 e status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('status', 'ok');
  });

  it('Validação (400): Deve rejeitar login com e-mail em formato inválido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'email-invalido', senha: '123' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toHaveProperty('detalhes');
  });

  it('RBAC (403): OPERADOR não deve conseguir apagar usuários', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/usuarios/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${tokenOperador}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('Regra de Negócio (409): Não deve permitir remover lote que contém equipamentos', async () => {
    const loteRes = await app.inject({
      method: 'POST',
      url: '/lotes',
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: { codigo: `LOT-DEL-${Date.now()}`, organizacaoId },
    });
    const loteId = loteRes.json().id;

    await app.inject({
      method: 'POST',
      url: '/equipamentos',
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: { codigoBarrasInterno: `EQP-DEL-${Date.now()}`, tipo: 'Monitor', loteId },
    });

    const delRes = await app.inject({
      method: 'DELETE',
      url: `/lotes/${loteId}`,
      headers: { authorization: `Bearer ${tokenAdmin}` },
    });

    expect(delRes.statusCode).toBe(409);
    expect(delRes.json().error).toContain('Não é possível remover um lote que possui equipamentos vinculados');
  });

  it('Movimentação em Massa (201): Deve movimentar múltiplos equipamentos e sincronizar o Lote', async () => {
    const loteRes = await app.inject({
      method: 'POST',
      url: '/lotes',
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: { codigo: `LOT-MASSA-${Date.now()}`, organizacaoId },
    });
    const loteId = loteRes.json().id;

    const eq1 = await app.inject({
      method: 'POST',
      url: '/equipamentos',
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: { codigoBarrasInterno: `EQP-M1-${Date.now()}`, tipo: 'Teclado', loteId },
    });
    const eq2 = await app.inject({
      method: 'POST',
      url: '/equipamentos',
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: { codigoBarrasInterno: `EQP-M2-${Date.now()}`, tipo: 'Mouse', loteId },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/movimentacoes/em-massa',
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: {
        itens: [
          { equipamentoId: eq1.json().id, version: 0 },
          { equipamentoId: eq2.json().id, version: 0 },
        ],
        statusNovo: 'EM_TRIAGEM',
        observacao: 'Triagem em lote',
      },
    });

    expect(res.statusCode).toBe(201);
    expect(Array.isArray(res.json())).toBe(true);
    expect(res.json().length).toBe(2);

    // Verifica se o Lote foi sincronizado para EM_TRIAGEM
    const loteCheck = await app.inject({
      method: 'GET',
      url: `/lotes/${loteId}`,
      headers: { authorization: `Bearer ${tokenAdmin}` },
    });
    expect(loteCheck.json().status).toBe('EM_TRIAGEM');
  });

  it('Concorrência Real - Bloqueio Otimista (409): Requisições simultâneas devem resultar em 1 Sucesso (201) e 1 Conflito (409)', async () => {
    const loteRes = await app.inject({
      method: 'POST',
      url: '/lotes',
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: { codigo: `LOT-RACE-${Date.now()}`, organizacaoId },
    });

    const eqRes = await app.inject({
      method: 'POST',
      url: '/equipamentos',
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: { codigoBarrasInterno: `EQP-RACE-${Date.now()}`, tipo: 'Nobreak', loteId: loteRes.json().id },
    });
    const eqId = eqRes.json().id;

    // Dispara 2 requisições idênticas simultâneas com a mesma versão (version: 0)
    const [req1, req2] = await Promise.all([
      app.inject({
        method: 'POST',
        url: '/movimentacoes',
        headers: { authorization: `Bearer ${tokenAdmin}` },
        payload: { equipamentoId: eqId, statusNovo: 'EM_TRIAGEM', version: 0 },
      }),
      app.inject({
        method: 'POST',
        url: '/movimentacoes',
        headers: { authorization: `Bearer ${tokenAdmin}` },
        payload: { equipamentoId: eqId, statusNovo: 'EM_TRIAGEM', version: 0 },
      }),
    ]);

    const statusCodes = [req1.statusCode, req2.statusCode].sort();
    
    // Uma deve ser processada com sucesso (201) e a outra barrada por conflito de versão (409)
    expect(statusCodes).toEqual([201, 409]);
  });
});