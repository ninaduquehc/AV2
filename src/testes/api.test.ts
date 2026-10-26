import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('GreenCode API - Suíte de Testes e Regras de Negócio', () => {
  let app: FastifyInstance;
  let tokenAdmin: string;
  let tokenOperador: string;
  let organizacaoId: string;
  let loteId: string;
  let equipamentoId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Login ADMIN
    const resAdmin = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'admin@greencode.com', senha: 'admin123' },
    });
    expect(resAdmin.statusCode).toBe(200);
    tokenAdmin = resAdmin.json().token;
    expect(tokenAdmin).toBeDefined();

    // Login OPERADOR
    const resOperador = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'operador@greencode.com', senha: 'operador123' },
    });
    expect(resOperador.statusCode).toBe(200);
    tokenOperador = resOperador.json().token;
    expect(tokenOperador).toBeDefined();

    // Busca a organização criada pelo Seed para garantir que sempre existirá uma válida
    const orgsRes = await app.inject({
      method: 'GET',
      url: '/organizacoes',
      headers: { authorization: `Bearer ${tokenAdmin}` },
    });
    expect(orgsRes.statusCode).toBe(200);
    expect(orgsRes.json().length).toBeGreaterThan(0);
    organizacaoId = orgsRes.json()[0].id;

    // Cria um Lote isolado para os testes
    const loteRes = await app.inject({
      method: 'POST',
      url: '/lotes',
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: {
        codigo: `LOT-TEST-${Date.now()}`,
        organizacaoId,
      },
    });
    expect(loteRes.statusCode).toBe(201);
    loteId = loteRes.json().id;

    // Cria Equipamento isolado para os testes (nascendo obrigatoriamente como RECEBIDO)
    const eqRes = await app.inject({
      method: 'POST',
      url: '/equipamentos',
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: {
        codigoBarrasInterno: `EQP-TEST-${Date.now()}`,
        tipo: 'Servidor Teste',
        loteId,
      },
    });
    expect(eqRes.statusCode).toBe(201);
    equipamentoId = eqRes.json().id;
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
    const res = await app.inject({
      method: 'POST',
      url: '/movimentacoes',
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: {
        equipamentoId,
        statusNovo: 'DESCARTE',
        version: 0,
      },
    });

    expect(res.statusCode).toBe(422);
    expect(res.json().error).toContain('Transição de status inválida');
  });

  it('Caminho Feliz (201): Deve movimentar de RECEBIDO para EM_TRIAGEM com sucesso', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/movimentacoes',
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: {
        equipamentoId,
        statusNovo: 'EM_TRIAGEM',
        version: 0,
        observacao: 'Iniciando triagem no laboratório',
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().statusNovo).toBe('EM_TRIAGEM');
  });

  it('Bloqueio Otimista (409): Deve falhar ao informar versão incompatível', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/movimentacoes',
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: {
        equipamentoId,
        statusNovo: 'EM_DESMONTAGEM',
        version: 0, // Versão antiga (a versão atual é 1 após a movimentação do teste anterior)
      },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error).toContain('Conflito de concorrência');
  });

  it('Rastreabilidade (200): Deve retornar o histórico de movimentações', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/movimentacoes/rastreabilidade/${equipamentoId}`,
      headers: { authorization: `Bearer ${tokenAdmin}` },
    });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
    expect(res.json().length).toBeGreaterThan(0);
  });
});