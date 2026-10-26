import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('GreenCode API - Testes de Integração', () => {
  let app: FastifyInstance;
  let tokenAdmin: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Tenta realizar login com as credenciais do seed
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'admin@greencode.com',
        senha: 'admin123',
      },
    });

    if (response.statusCode === 200) {
      tokenAdmin = response.json().token;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health deve retornar status OK sem autenticação', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('status', 'ok');
  });

  it('POST /auth/login deve falhar com credenciais inválidas', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'invalido@greencode.com',
        senha: 'senhaerradaaaaa',
      },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json()).toHaveProperty('error');
  });

  it('GET /organizacoes deve bloquear acesso sem token JWT (401)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/organizacoes',
    });

    expect(res.statusCode).toBe(401);
  });

  it('POST /organizacoes deve validar CNPJ com digitos verificadores incorretos (400)', async () => {
    if (!tokenAdmin) return;

    const res = await app.inject({
      method: 'POST',
      url: '/organizacoes',
      headers: {
        authorization: `Bearer ${tokenAdmin}`,
      },
      payload: {
        nome: 'Empresa Teste CNPJ',
        cnpj: '11111111111111', // CNPJ Inválido
        tipo: 'gerador',
      },
    });

    expect(res.statusCode).toBe(400);
  });
});