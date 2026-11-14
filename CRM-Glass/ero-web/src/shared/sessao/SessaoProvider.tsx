import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sessaoApi } from '../api/auth';
import { api } from '../api/cliente';
import { ErroApi } from '../api/erros';
import type { AutenticacaoResposta, TemaApi, UsuarioLogado } from '../api/tipos';
import { ESTADO_INICIAL, identidadeDoUsuario, reduzirSessao, trocouIdentidade, usuarioDoEstado, type EstadoSessao } from './estado';

export type SessaoCtx = {
  estado: EstadoSessao;
  /** usuário da sessão (pendente ou autenticado); null fora dela */
  usuario: UsuarioLogado | null;
  /** guarda o token e o usuário da resposta do verificar (ou do refresh) */
  entrar: (resposta: AutenticacaoResposta) => Promise<UsuarioLogado>;
  /** relê o `/api/auth/eu` (ex.: depois de trocar a senha) */
  atualizarEu: () => Promise<UsuarioLogado>;
  /**
   * Grava o tema do próprio usuário (`PUT /api/auth/eu/tema`; `null` segue o contratante). Já muda o
   * `temaPreferido` da sessão antes da resposta (a interface troca na hora); se a gravação falhar, volta ao
   * anterior e rejeita com o `ErroApi`, para quem chamou avisar com `useMessage().erroApi`.
   */
  trocarTemaPreferido: (tema: TemaApi | null) => Promise<void>;
  /**
   * Superadmin entra num contratante (`POST /api/auth/superadmin/acessar/{id}`) ou volta à plataforma
   * (`/sair`). Guarda o token e o usuário novos; quem chamou leva ao Início. O cache das telas NÃO é limpo aqui:
   * a casca antiga ainda está saindo com os dados que tinha; a raiz limpa quando ela termina de sair, antes de a
   * casca nova montar (`app/trocaDeContratante.ts`). Falhou: rejeita com o `ErroApi` e nada muda.
   */
  acessarContratante: (tenantId: string) => Promise<void>;
  sairDoContratante: () => Promise<void>;
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

  /*
   * Troca de contratante pedida pelo próprio superadmin. Diferente da troca de identidade que chega sozinha (outra
   * aba, renovação), aqui se sabe que a casca vai trocar inteira (a chave da área é `casca:${tenantId}`):
   * - as consultas no ar são canceladas (a resposta de um contratante não pode cair no cache depois da troca);
   * - a identidade nova é registrada ANTES de despachar o usuário, para o `definirUsuario` não limpar o cache com a
   *   casca antiga ainda na tela (ela piscaria para o esqueleto e, se relesse, buscaria com o token do outro
   *   contratante, mostrando dados dele na casca que sai);
   * - quem limpa é a raiz, no fim da saída da casca antiga e antes de a nova montar.
   */
  const trocarDeContratante = useCallback(
    async (chamar: () => Promise<AutenticacaoResposta>) => {
      const resposta = await chamar();
      await queryClient.cancelQueries();
      api.definirToken(resposta.tokenAcesso ?? null);
      const usuario = resposta.usuario ?? (await sessaoApi.eu());
      identidade.current = identidadeDoUsuario(usuario);
      despachar({ tipo: 'usuario', usuario });
    },
    [queryClient],
  );

  const acessarContratante = useCallback<SessaoCtx['acessarContratante']>(
    (tenantId) => trocarDeContratante(() => sessaoApi.acessarContratante(tenantId)),
    [trocarDeContratante],
  );

  const sairDoContratante = useCallback<SessaoCtx['sairDoContratante']>(
    () => trocarDeContratante(() => sessaoApi.sairDoContratante()),
    [trocarDeContratante],
  );

  const sair = useCallback(async () => {
    // Espera o logout: se a página for recarregada logo depois, o cookie já não abre a sessão de novo.
    await sessaoApi.sair().catch(() => undefined);
    api.definirToken(null);
    encerrar('saiu');
  }, [encerrar]);

  const tentarDeNovo = useCallback(() => void iniciar(), [iniciar]);

  const temaAtual = useRef<TemaApi | null>(null);
  temaAtual.current = usuarioDoEstado(estado)?.temaPreferido ?? null;
  /** Gravação mais recente: só ela desfaz a troca, para uma falha antiga não apagar a escolha seguinte. */
  const vezTema = useRef(0);

  const trocarTemaPreferido = useCallback<SessaoCtx['trocarTemaPreferido']>(async (tema) => {
    const anterior = temaAtual.current;
    const minha = ++vezTema.current;
    despachar({ tipo: 'temaPreferido', tema });
    try {
      await sessaoApi.trocarTema(tema);
    } catch (e) {
      if (minha === vezTema.current) despachar({ tipo: 'temaPreferido', tema: anterior });
      throw e;
    }
  }, []);

  const value = useMemo<SessaoCtx>(
    () => ({
      estado,
      usuario: usuarioDoEstado(estado),
      entrar,
      atualizarEu,
      trocarTemaPreferido,
      acessarContratante,
      sairDoContratante,
      sair,
      tentarDeNovo,
    }),
    [estado, entrar, atualizarEu, trocarTemaPreferido, acessarContratante, sairDoContratante, sair, tentarDeNovo],
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

/**
 * Usuário da casca, ou null fora dela. Para o que também se desenha fora da casca (a folha impressa na prévia do
 * catálogo `/design-system`); tela de módulo usa `useUsuarioAtual`.
 */
export function useUsuarioDaCasca(): UsuarioLogado | null {
  return useContext(UsuarioDaCasca);
}
