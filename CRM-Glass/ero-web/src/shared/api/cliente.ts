import type { ZodType } from 'zod';
import { ErroApi, erroDeRede, erroDeResposta } from './erros';
import { autenticacaoRespostaSchema, type AutenticacaoResposta } from './tipos';

/*
 * Cliente HTTP da ero-api.
 * - Token de acesso só em memória (nunca localStorage/sessionStorage). Some ao recarregar: a sessão volta
 *   pelo refresh, que usa o cookie httpOnly `ero_refresh` (Path=/api/auth).
 * - `credentials: 'include'` em tudo; `X-Ero-Refresh: 1` no refresh e no logout (anti-CSRF).
 * - 401 numa rota autenticada → UMA renovação por vez (as chamadas que chegarem juntas esperam a mesma)
 *   e a requisição é repetida uma vez. Se a renovação for recusada, a sessão acabou: avisa quem ouve
 *   (`aoEncerrarSessao`), que manda para /login?voltar=.
 * - Erro → ErroApi (ProblemDetail tipado).
 */

export type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type OpcoesRequisicao<T> = {
  metodo?: Metodo;
  corpo?: unknown;
  /** rota pública (login, código): não manda Bearer e não tenta renovar no 401 */
  publica?: boolean;
  /** manda `X-Ero-Refresh: 1` (refresh e logout) */
  refresh?: boolean;
  /** valida e tipa a resposta */
  schema?: ZodType<T>;
  sinal?: AbortSignal;
};

export type ConfigCliente = {
  /** prefixo das rotas (padrão: mesma origem; o Vite faz o proxy de /api para a 8080) */
  base?: string;
  fetch?: typeof fetch;
  /**
   * Executa a renovação com exclusão entre abas (Web Locks), para duas abas não renovarem o mesmo cookie
   * ao mesmo tempo. Padrão: `navigator.locks` quando existe; senão, executa direto.
   */
  travaEntreAbas?: <R>(fn: () => Promise<R>) => Promise<R>;
  /** relógio local (testes) */
  agora?: () => number;
};

type OuvinteRenovou = (r: AutenticacaoResposta) => void;
type OuvinteEncerrada = (e: ErroApi) => void;

const travaPadrao = <R,>(fn: () => Promise<R>): Promise<R> => {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  return locks ? (locks.request('ero-refresh', fn) as Promise<R>) : fn();
};

/** Diferença maior que esta entre o relógio do servidor (header Date) e o local passa a ser compensada. */
const TOLERANCIA_RELOGIO_MS = 2000;

export function criarCliente(cfg: ConfigCliente = {}) {
  const base = cfg.base ?? '';
  const f = cfg.fetch ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  const trava = cfg.travaEntreAbas ?? travaPadrao;
  const agoraLocal = cfg.agora ?? Date.now;

  let token: string | null = null;
  let renovando: Promise<AutenticacaoResposta> | null = null;
  let desvioRelogio = 0;
  const renovou = new Set<OuvinteRenovou>();
  const encerrada = new Set<OuvinteEncerrada>();

  function registrarRelogio(res: Response) {
    const data = Date.parse(res.headers.get('Date') ?? '');
    if (Number.isNaN(data)) return;
    const d = data - agoraLocal();
    desvioRelogio = Math.abs(d) > TOLERANCIA_RELOGIO_MS ? d : 0;
  }

  async function executar<T>(caminho: string, op: OpcoesRequisicao<T>, bearer: string | null): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (op.corpo !== undefined) headers['Content-Type'] = 'application/json';
    if (bearer) headers.Authorization = `Bearer ${bearer}`;
    if (op.refresh) headers['X-Ero-Refresh'] = '1';

    let res: Response;
    try {
      res = await f(`${base}${caminho}`, {
        method: op.metodo ?? 'GET',
        headers,
        body: op.corpo === undefined ? undefined : JSON.stringify(op.corpo),
        credentials: 'include',
        signal: op.sinal,
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw e;
      throw erroDeRede();
    }
    registrarRelogio(res);
    if (!res.ok) throw await erroDeResposta(res);
    if (res.status === 204 || res.status === 205) return undefined as T;

    const tipo = res.headers.get('Content-Type') ?? '';
    const corpo: unknown = tipo.includes('json') ? await res.json().catch(() => undefined) : undefined;
    if (!op.schema) return corpo as T;
    const r = op.schema.safeParse(corpo);
    if (!r.success) {
      throw new ErroApi({
        status: res.status,
        codigo: 'RESPOSTA_INVALIDA',
        detail: 'Recebemos uma resposta inesperada do servidor. Tente de novo em instantes.',
      });
    }
    return r.data;
  }

  /** Renova a sessão pelo cookie. Uma por vez: quem chamar durante uma renovação recebe a mesma promessa. */
  function renovar(): Promise<AutenticacaoResposta> {
    if (!renovando) {
      renovando = trava(() =>
        executar('/api/auth/refresh', { metodo: 'POST', publica: true, refresh: true, schema: autenticacaoRespostaSchema }, null),
      )
        .then((r) => {
          token = r.tokenAcesso ?? null;
          renovou.forEach((o) => o(r));
          return r;
        })
        .finally(() => {
          renovando = null;
        });
    }
    return renovando;
  }

  function encerrar(e: ErroApi) {
    token = null;
    encerrada.forEach((o) => o(e));
  }

  /** Chamada à API. Em rota autenticada, cuida do Bearer e da renovação no 401. */
  async function requisitar<T = unknown>(caminho: string, op: OpcoesRequisicao<T> = {}): Promise<T> {
    if (op.publica) return executar(caminho, op, null);

    const usado = token;
    try {
      return await executar(caminho, op, usado);
    } catch (e) {
      if (!(e instanceof ErroApi) || e.status !== 401) throw e;
    }

    // 401: se outra chamada já renovou enquanto esta estava no ar, só repete com o token novo.
    if (!(token && token !== usado)) {
      try {
        await renovar();
      } catch (r) {
        if (r instanceof ErroApi && (r.status === 401 || r.status === 403)) {
          encerrar(r);
        }
        throw r;
      }
    }

    try {
      return await executar(caminho, op, token);
    } catch (e) {
      // Token recém-renovado e ainda 401: a sessão não vale mais.
      if (e instanceof ErroApi && e.status === 401) encerrar(e);
      throw e;
    }
  }

  return {
    requisitar,
    renovar,
    /** guarda o token de acesso (só em memória) */
    definirToken: (t: string | null) => {
      token = t;
    },
    obterToken: () => token,
    /** avisado a cada renovação bem-sucedida (usuário e aparência podem ter mudado) */
    aoRenovar(o: OuvinteRenovou) {
      renovou.add(o);
      return () => void renovou.delete(o);
    },
    /** avisado quando a sessão acaba sozinha (renovação recusada) */
    aoEncerrarSessao(o: OuvinteEncerrada) {
      encerrada.add(o);
      return () => void encerrada.delete(o);
    },
    /** "agora" no relógio do servidor (contagens do código usam os horários ISO que a API manda) */
    agoraServidor: () => agoraLocal() + desvioRelogio,
  };
}

export type ClienteApi = ReturnType<typeof criarCliente>;

/** Cliente do app. */
export const api = criarCliente();
