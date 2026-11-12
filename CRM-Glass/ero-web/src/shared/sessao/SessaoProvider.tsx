import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sessaoApi } from '../api/auth';
import { api } from '../api/cliente';
import { ErroApi } from '../api/erros';
import type { AutenticacaoResposta, UsuarioLogado } from '../api/tipos';
import { ESTADO_INICIAL, identidadeDoUsuario, reduzirSessao, trocouIdentidade, usuarioDoEstado, type EstadoSessao } from './estado';

export type SessaoCtx = {
  estado: EstadoSessao;
  /** usuário da sessão (pendente ou autenticado); null fora dela */
  usuario: UsuarioLogado | null;
  /** guarda o token e o usuário da resposta do verificar (ou do refresh) */
  entrar: (resposta: AutenticacaoResposta) => Promise<UsuarioLogado>;
  /** relê o `/api/auth/eu` (ex.: depois de trocar a senha) */
  atualizarEu: () => Promise<UsuarioLogado>;
  /** encerra a sessão na API e no front (token, cache das telas) */
  sair: () => Promise<void>;
  /** abre a sessão de novo pelo cookie (tela "servidor indisponível") */
  tentarDeNovo: () => void;
};

const Ctx = createContext<SessaoCtx | null>(null);

/**
 * Sessão do app. Ao abrir a página tenta renovar pelo cookie (Splash enquanto isso); sem sessão, vai ao login.
 * O token fica só em memória (shared/api/cliente). A aparência do contratante NÃO é aplicada aqui: quem aplica
 * é a raiz do app, quando a área que sai (login ou casca) termina de se desmontar (TrocaDeArea).
 */
export function SessaoProvider({ children }: { children: ReactNode }) {
  const [estado, despachar] = useReducer(reduzirSessao, ESTADO_INICIAL);
  const queryClient = useQueryClient();

  /*
   * Usuário + contratante da sessão atual. Toda entrada de usuário passa por definirUsuario: se outra
   * aba entrou com outra conta (a renovação traz esse usuário) ou o contratante mudou, o cache das
   * telas é de outra pessoa e é limpo antes de qualquer tela ler dele.
   */
  const identidade = useRef<string | null>(null);

  const definirUsuario = useCallback(
    (usuario: UsuarioLogado) => {
      if (trocouIdentidade(identidade.current, usuario)) queryClient.clear();
      identidade.current = identidadeDoUsuario(usuario);
      despachar({ tipo: 'usuario', usuario });
      return usuario;
    },
    [queryClient],
  );

  /** Sessão encerrada (Sair ou renovação recusada): esquece a identidade e o cache. */
  const encerrar = useCallback(
    (motivo: 'saiu' | 'expirou') => {
      identidade.current = null;
      despachar({ tipo: 'encerrada', motivo });
      queryClient.clear();
    },
    [queryClient],
  );

  const iniciar = useCallback(async () => {
    despachar({ tipo: 'iniciar' });
    try {
      const r = await sessaoApi.renovar();
      definirUsuario(r.usuario ?? (await sessaoApi.eu()));
    } catch (e) {
      const erro = e instanceof ErroApi ? e : new ErroApi({ status: 0 });
      if (erro.status === 401 || erro.status === 403) {
        api.definirToken(null);
        identidade.current = null;
        despachar({ tipo: 'semSessao' });
      } else {
        despachar({ tipo: 'indisponivel', detail: erro.detail, correlationId: erro.correlationId });
      }
    }
  }, [definirUsuario]);

  // Abre a sessão uma vez (o StrictMode roda o efeito duas vezes; a renovação também é única no cliente).
  const iniciou = useRef(false);
  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;
    void iniciar();
  }, [iniciar]);

  // Renovações automáticas (401 no meio do uso) trazem o usuário atualizado; recusadas encerram a sessão.
  useEffect(() => {
    const parar1 = api.aoRenovar((r) => {
      if (r.usuario) definirUsuario(r.usuario);
    });
    const parar2 = api.aoEncerrarSessao(() => encerrar('expirou'));
    return () => {
      parar1();
      parar2();
    };
  }, [definirUsuario, encerrar]);

  const atualizarEu = useCallback(async () => definirUsuario(await sessaoApi.eu()), [definirUsuario]);

  const entrar = useCallback<SessaoCtx['entrar']>(
    async (resposta) => {
      api.definirToken(resposta.tokenAcesso ?? null);
      if (resposta.usuario) return definirUsuario(resposta.usuario);
      return atualizarEu();
    },
    [definirUsuario, atualizarEu],
  );

  const sair = useCallback(async () => {
    // Espera o logout: se a página for recarregada logo depois, o cookie já não abre a sessão de novo.
    await sessaoApi.sair().catch(() => undefined);
    api.definirToken(null);
    encerrar('saiu');
  }, [encerrar]);

  const tentarDeNovo = useCallback(() => void iniciar(), [iniciar]);

  const value = useMemo<SessaoCtx>(
    () => ({ estado, usuario: usuarioDoEstado(estado), entrar, atualizarEu, sair, tentarDeNovo }),
    [estado, entrar, atualizarEu, sair, tentarDeNovo],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSessao() {
  const c = useContext(Ctx);
  if (!c) throw new Error('SessaoProvider ausente');
  return c;
}

/*
 * Usuário da casca: o último usuário autenticado que a casca viu. Continua o mesmo enquanto a casca se
 * desmonta (logout, sessão expirada), para o nome e o contratante não sumirem no meio da animação.
 */
const UsuarioDaCasca = createContext<UsuarioLogado | null>(null);
export const UsuarioDaCascaProvider = UsuarioDaCasca.Provider;

/** Usuário logado, para as telas dentro da casca. */
export function useUsuarioAtual(): UsuarioLogado {
  const u = useContext(UsuarioDaCasca);
  if (!u) throw new Error('useUsuarioAtual fora da casca');
  return u;
}
