import { describe, expect, it } from 'vitest';
import { ErroApi, erroDeProblemDetail, erroDeResposta, lerRetryAfter } from './erros';

describe('ErroApi a partir do ProblemDetail', () => {
  it('lê os campos da ero-api', () => {
    const e = erroDeProblemDetail(400, {
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: 'Existem campos inválidos.',
      instance: '/api/auth/login',
      codigo: 'VALIDACAO',
      correlationId: 'c0ffee',
      erros: [
        { campo: 'email', mensagem: 'E-mail inválido' },
        { campo: 'senha', mensagem: 'Senha é obrigatória' },
        { campo: 1, mensagem: 'ignorado' },
        null,
      ],
    });
    expect(e).toBeInstanceOf(ErroApi);
    expect(e).toBeInstanceOf(Error);
    expect(e.status).toBe(400);
    expect(e.codigo).toBe('VALIDACAO');
    expect(e.detail).toBe('Existem campos inválidos.');
    expect(e.message).toBe('Existem campos inválidos.');
    expect(e.titulo).toBe('Bad Request');
    expect(e.correlationId).toBe('c0ffee');
    expect(e.erros).toEqual([
      { campo: 'email', mensagem: 'E-mail inválido' },
      { campo: 'senha', mensagem: 'Senha é obrigatória' },
    ]);
    expect(e.doCampo('senha')).toBe('Senha é obrigatória');
    expect(e.doCampo('nome')).toBeUndefined();
    expect(e.retryAfter).toBeNull();
  });

  it('429 traz o Retry-After em segundos', () => {
    const e = erroDeProblemDetail(429, { detail: 'Aguarde 42 segundos para pedir outro código.', codigo: 'MUITAS_REQUISICOES' }, '42');
    expect(e.retryAfter).toBe(42);
    expect(e.detail).toBe('Aguarde 42 segundos para pedir outro código.');
  });

  it('sem corpo: texto padrão pelo status e código HTTP_<status>', () => {
    const e = erroDeProblemDetail(502, null);
    expect(e.codigo).toBe('HTTP_502');
    expect(e.detail).toMatch(/Tente de novo/);
    expect(erroDeProblemDetail(401, 'texto').detail).toBe('Sessão inválida ou expirada. Faça login de novo.');
  });

  it('erro de rede tem status 0 e código REDE', () => {
    const e = new ErroApi({ status: 0 });
    expect(e.semConexao).toBe(true);
    expect(e.codigo).toBe('REDE');
    expect(e.detail).toMatch(/servidor/);
  });

  it('lê uma Response de erro (application/problem+json)', async () => {
    const res = new Response(JSON.stringify({ detail: 'E-mail ou senha inválidos.', codigo: 'NAO_AUTENTICADO', correlationId: 'x1' }), {
      status: 401,
      headers: { 'Content-Type': 'application/problem+json' },
    });
    const e = await erroDeResposta(res);
    expect(e.status).toBe(401);
    expect(e.detail).toBe('E-mail ou senha inválidos.');
    expect(e.correlationId).toBe('x1');
  });

  it('Response 429 com Retry-After e corpo que não é JSON', async () => {
    const res = new Response('Too Many Requests', { status: 429, headers: { 'Retry-After': '17', 'Content-Type': 'text/plain' } });
    const e = await erroDeResposta(res);
    expect(e.retryAfter).toBe(17);
    expect(e.detail).toMatch(/Muitas tentativas/);
  });
});

describe('lerRetryAfter', () => {
  it('segundos', () => {
    expect(lerRetryAfter('0')).toBe(0);
    expect(lerRetryAfter(' 60 ')).toBe(60);
  });

  it('data HTTP', () => {
    const agora = Date.parse('2026-11-11T12:00:00Z');
    expect(lerRetryAfter('Wed, 11 Nov 2026 12:00:30 GMT', agora)).toBe(30);
    expect(lerRetryAfter('Wed, 11 Nov 2026 11:59:00 GMT', agora)).toBe(0);
  });

  it('ausente ou inválido → null', () => {
    expect(lerRetryAfter(null)).toBeNull();
    expect(lerRetryAfter('')).toBeNull();
    expect(lerRetryAfter('logo')).toBeNull();
    expect(lerRetryAfter('-5')).toBeNull();
  });
});
