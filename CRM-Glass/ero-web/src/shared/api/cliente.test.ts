import { describe, expect, it, vi } from 'vitest';
import { criarCliente } from './cliente';
import { ErroApi } from './erros';

type Chamada = { url: string; init: RequestInit; headers: Record<string, string> };

const json = (status: number, corpo: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json', ...headers } });

const problema = (status: number, detail: string, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify({ status, detail, codigo: status === 401 ? 'NAO_AUTENTICADO' : 'X' }), {
    status,
    headers: { 'Content-Type': 'application/problem+json', ...headers },
  });

const usuario = {
  id: 'u1',
  nome: 'Ana Ribeiro',
  email: 'ana@demo.com.br',
  papel: 'ADMIN',
  tenantId: 't1',
  tenantNome: 'Demo Solar',
  aparencia: null,
  superadminAtuando: false,
  pendencia: 'NENHUMA',
  permissoes: ['USUARIOS_LER'],
  telas: ['usuario-list'],
};

const renovado = (token: string) => ({
  requerDoisFatores: false,
  desafioDoisFatores: null,
  emailMascarado: null,
  codigoExpiraEm: null,
  reenvioDisponivelEm: null,
  tokenAcesso: token,
  tokenExpiraEm: '2026-11-11T12:15:00Z',
  usuario,
});

/** fetch falso: cada rota responde pela função dada; guarda as chamadas. */
function fetchFalso(rotas: Record<string, (c: Chamada) => Response | Promise<Response>>) {
  const chamadas: Chamada[] = [];
  const f = vi.fn(async (url: RequestInfo | URL, init: RequestInit = {}) => {
    const headers = { ...(init.headers as Record<string, string>) };
    const c = { url: String(url), init, headers };
    chamadas.push(c);
    const rota = rotas[String(url)];
    if (!rota) throw new TypeError('Failed to fetch');
    return rota(c);
  });
  return { f: f as unknown as typeof fetch, chamadas };
}

const semTrava = <R,>(fn: () => Promise<R>) => fn();

describe('cliente da API', () => {
  it('manda Bearer, credentials include e JSON; valida a resposta', async () => {
    const { f, chamadas } = fetchFalso({ '/api/auth/eu': () => json(200, usuario) });
    const c = criarCliente({ fetch: f, travaEntreAbas: semTrava });
    c.definirToken('tok-1');
    const r = await c.requisitar('/api/auth/eu');
    expect(r).toEqual(usuario);
    expect(chamadas[0].headers.Authorization).toBe('Bearer tok-1');
    expect(chamadas[0].init.credentials).toBe('include');
    expect(chamadas[0].headers['X-Ero-Refresh']).toBeUndefined();
  });

  it('rota pública não manda Bearer nem tenta renovar no 401', async () => {
    const { f, chamadas } = fetchFalso({ '/api/auth/login': () => problema(401, 'E-mail ou senha inválidos.') });
    const c = criarCliente({ fetch: f, travaEntreAbas: semTrava });
    c.definirToken('tok-1');
    await expect(c.requisitar('/api/auth/login', { metodo: 'POST', corpo: { email: 'a', senha: 'b' }, publica: true })).rejects.toMatchObject({
      status: 401,
      detail: 'E-mail ou senha inválidos.',
    });
    expect(chamadas).toHaveLength(1);
    expect(chamadas[0].headers.Authorization).toBeUndefined();
    expect(chamadas[0].headers['Content-Type']).toBe('application/json');
    expect(chamadas[0].init.body).toBe(JSON.stringify({ email: 'a', senha: 'b' }));
  });

  it('refresh vai com X-Ero-Refresh: 1 e cookie (credentials include), e guarda o token novo', async () => {
    const { f, chamadas } = fetchFalso({ '/api/auth/refresh': () => json(200, renovado('tok-novo')) });
    const c = criarCliente({ fetch: f, travaEntreAbas: semTrava });
    const r = await c.renovar();
    expect(r.usuario?.nome).toBe('Ana Ribeiro');
    expect(c.obterToken()).toBe('tok-novo');
    expect(chamadas[0].init.method).toBe('POST');
    expect(chamadas[0].headers['X-Ero-Refresh']).toBe('1');
    expect(chamadas[0].init.credentials).toBe('include');
    expect(chamadas[0].headers.Authorization).toBeUndefined();
  });

  it('duas chamadas com 401 ao mesmo tempo → um refresh só, e as duas repetem com o token novo', async () => {
    let liberarRefresh!: () => void;
    const refreshPronto = new Promise<void>((r) => (liberarRefresh = r));
    const { f, chamadas } = fetchFalso({
      '/api/a': (c) => (c.headers.Authorization === 'Bearer tok-novo' ? json(200, { a: 1 }) : problema(401, 'Sessão inválida ou expirada.')),
      '/api/b': (c) => (c.headers.Authorization === 'Bearer tok-novo' ? json(200, { b: 2 }) : problema(401, 'Sessão inválida ou expirada.')),
      '/api/auth/refresh': async () => {
        await refreshPronto;
        return json(200, renovado('tok-novo'));
      },
    });
    const c = criarCliente({ fetch: f, travaEntreAbas: semTrava });
    const renovou = vi.fn();
    c.aoRenovar(renovou);
    c.definirToken('tok-velho');

    const pa = c.requisitar('/api/a');
    const pb = c.requisitar('/api/b');
    await vi.waitFor(() => expect(chamadas.filter((x) => x.url === '/api/auth/refresh')).toHaveLength(1));
    liberarRefresh();

    await expect(pa).resolves.toEqual({ a: 1 });
    await expect(pb).resolves.toEqual({ b: 2 });
    expect(chamadas.filter((x) => x.url === '/api/auth/refresh')).toHaveLength(1);
    expect(renovou).toHaveBeenCalledTimes(1);
    expect(c.obterToken()).toBe('tok-novo');
  });

  it('401 quando outra chamada já renovou: só repete, sem renovar de novo', async () => {
    const { f, chamadas } = fetchFalso({
      '/api/a': (x) => (x.headers.Authorization === 'Bearer tok-2' ? json(200, { ok: true }) : problema(401, 'expirou')),
    });
    // Simula a renovação de outra chamada terminando enquanto esta estava no ar (token troca antes do 401 chegar).
    const comTroca = (async (...a: Parameters<typeof fetch>) => {
      const r = await f(...a);
      c.definirToken('tok-2');
      return r;
    }) as typeof fetch;
    const c = criarCliente({ fetch: comTroca, travaEntreAbas: semTrava });
    c.definirToken('tok-1');
    await expect(c.requisitar('/api/a')).resolves.toEqual({ ok: true });
    expect(chamadas.map((x) => x.headers.Authorization)).toEqual(['Bearer tok-1', 'Bearer tok-2']);
    expect(chamadas.some((x) => x.url === '/api/auth/refresh')).toBe(false);
  });

  it('renovação recusada → avisa que a sessão acabou e apaga o token', async () => {
    const { f, chamadas } = fetchFalso({
      '/api/a': () => problema(401, 'Sessão inválida ou expirada.'),
      '/api/auth/refresh': () => problema(401, 'Sessão inválida ou expirada. Faça login de novo.'),
    });
    const c = criarCliente({ fetch: f, travaEntreAbas: semTrava });
    const encerrou = vi.fn();
    c.aoEncerrarSessao(encerrou);
    c.definirToken('tok-velho');
    await expect(c.requisitar('/api/a')).rejects.toBeInstanceOf(ErroApi);
    expect(encerrou).toHaveBeenCalledTimes(1);
    expect(c.obterToken()).toBeNull();
    expect(chamadas.filter((x) => x.url === '/api/a')).toHaveLength(1);
  });

  it('renovação sem rede não encerra a sessão (só falha a chamada)', async () => {
    const { f } = fetchFalso({ '/api/a': () => problema(401, 'expirou') });
    const c = criarCliente({ fetch: f, travaEntreAbas: semTrava });
    const encerrou = vi.fn();
    c.aoEncerrarSessao(encerrou);
    c.definirToken('tok');
    await expect(c.requisitar('/api/a')).rejects.toMatchObject({ status: 0, codigo: 'REDE' });
    expect(encerrou).not.toHaveBeenCalled();
  });

  it('204 devolve undefined; resposta fora do formato vira ErroApi', async () => {
    const { f } = fetchFalso({
      '/api/auth/logout': () => new Response(null, { status: 204 }),
      '/api/auth/refresh': () => json(200, { tokenAcesso: 1 }),
    });
    const c = criarCliente({ fetch: f, travaEntreAbas: semTrava });
    await expect(c.requisitar('/api/auth/logout', { metodo: 'POST', publica: true, refresh: true })).resolves.toBeUndefined();
    await expect(c.renovar()).rejects.toMatchObject({ codigo: 'RESPOSTA_INVALIDA' });
  });

  it('compensa o relógio local pelo header Date do servidor', async () => {
    const agoraLocal = Date.parse('2026-11-11T12:00:00Z');
    const { f } = fetchFalso({ '/api/x': () => json(200, {}, { Date: 'Wed, 11 Nov 2026 12:05:00 GMT' }) });
    const c = criarCliente({ fetch: f, travaEntreAbas: semTrava, agora: () => agoraLocal });
    expect(c.agoraServidor()).toBe(agoraLocal);
    await c.requisitar('/api/x', { publica: true });
    expect(c.agoraServidor()).toBe(Date.parse('2026-11-11T12:05:00Z'));
  });
});
