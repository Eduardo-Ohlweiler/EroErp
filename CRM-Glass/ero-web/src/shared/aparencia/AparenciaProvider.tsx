import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';
import { PADRAO_SISTEMA, deApi, sanear, type AparenciaApi, type Settings, type Theme } from './mapear';

export type { Accent, AparenciaApi, Fundo, FundoCatalogo, Movimento, Settings, Theme } from './mapear';
export { DEFAULT_SETTINGS, PADRAO_SISTEMA } from './mapear';

/**
 * Aparência aplicada na interface, em camadas (a de cima vence):
 *   1. padrão do sistema  (sempre; é o que vale na tela de login)
 *   2. contratante        (`usuario.aparencia` vindo da API: login, refresh, acessar/sair de contratante)
 *   3. prévia             (temporária, tela de Configuração do contratante)
 * Não há camada do usuário e nada sobre o contratante vai para o localStorage.
 *
 * Tema: quando o tema pedido pelas camadas muda, a troca passa pelo `trocarTema` recebido por prop
 * (ponto de extensão do motion-designer: View Transition + cena). Sem ele, a troca é direta.
 */

/** O que o `trocarTema` recebe. */
export type TrocaTema = {
  novo: Theme;
  anterior: Theme;
  /**
   * Aplica o tema na interface (estado do React + `data-theme` no <html>).
   * Para a View Transition capturar o quadro novo, chame dentro de `flushSync`.
   */
  aplicar: (tema: Theme) => void;
  /** true com `prefers-reduced-motion` do sistema ou animações REDUZIDAS do contratante. */
  reduzir: boolean;
};
/**
 * Ponto de extensão da troca de tema. Deve chamar `aplicar(novo)` em algum momento
 * (ex.: quando a cena passar do ponto de troca). Se terminar sem aplicar e o tema ainda for o pedido,
 * o provider aplica direto, para a interface nunca ficar no tema errado.
 */
export type TrocarTema = (troca: TrocaTema) => void | Promise<void>;

export type AparenciaCtx = {
  /** Aparência aplicada agora (o tema pode estar um passo atrás de `alvo` durante a troca em vídeo). */
  settings: Settings;
  /** Aparência pedida pelas camadas. */
  alvo: Settings;
  /** true enquanto a troca de tema está em andamento. */
  trocandoTema: boolean;
  /** true enquanto há prévia ativa. */
  emPrevia: boolean;
  /** Camada do contratante (`usuario.aparencia`); `null` volta ao padrão do sistema (logout). */
  definirContratante: (aparencia: Partial<AparenciaApi> | null | undefined) => void;
  /** Substitui a prévia inteira pela aparência informada (formato da API). */
  definirPrevia: (aparencia: Partial<AparenciaApi>) => void;
  /** Desfaz a prévia (ao sair, cancelar ou salvar a Configuração). */
  limparPrevia: () => void;
  /** Compatibilidade com o protótipo: mescla ajustes do front na prévia. */
  set: (p: Partial<Settings>) => void;
  /** Compatibilidade com o protótipo: o mesmo que `limparPrevia`. */
  reset: () => void;
};

const Ctx = createContext<AparenciaCtx | null>(null);

export function AparenciaProvider({ children, trocarTema }: { children: ReactNode; trocarTema?: TrocarTema }) {
  const [contratante, setContratante] = useState<Partial<Settings> | null>(null);
  const [previa, setPrevia] = useState<Partial<Settings> | null>(null);

  const alvo = useMemo<Settings>(() => ({ ...PADRAO_SISTEMA, ...contratante, ...previa }), [contratante, previa]);

  const [temaAplicado, setTemaAplicado] = useState<Theme>(alvo.theme);
  const [trocandoTema, setTrocandoTema] = useState(false);
  const aplicado = useRef<Theme>(alvo.theme);
  const pedido = useRef<Theme>(alvo.theme);
  const trocador = useRef(trocarTema);
  trocador.current = trocarTema;

  const sys = useReducedMotion();
  const reduzir = !!sys || alvo.movimento === 'reduzida';
  const reduzirRef = useRef(reduzir);
  reduzirRef.current = reduzir;

  const aplicar = useCallback((tema: Theme) => {
    aplicado.current = tema;
    document.documentElement.dataset.theme = tema;
    setTemaAplicado(tema);
  }, []);

  // Tema pedido mudou: passa pelo ponto de extensão (troca em vídeo) ou aplica direto.
  useEffect(() => {
    const novo = alvo.theme;
    if (novo === pedido.current) return;
    pedido.current = novo;
    const fn = trocador.current;
    if (!fn) {
      aplicar(novo);
      return;
    }
    setTrocandoTema(true);
    const fim = () => {
      if (pedido.current !== novo) return; // outra troca tomou o lugar desta
      if (aplicado.current !== novo) aplicar(novo);
      setTrocandoTema(false);
    };
    try {
      Promise.resolve(fn({ novo, anterior: aplicado.current, aplicar, reduzir: reduzirRef.current })).then(fim, fim);
    } catch {
      fim();
    }
  }, [alvo.theme, aplicar]);

  // Atributos e variáveis no <html>, antes da pintura (sem piscar).
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = temaAplicado;
    root.dataset.accent = alvo.accent;
    root.style.setProperty('--blur', `${alvo.blur}px`);
    root.style.setProperty('--scene-blur', `${alvo.fundoFoco}px`);
    root.dataset.movimento = alvo.movimento;
  }, [temaAplicado, alvo.accent, alvo.blur, alvo.fundoFoco, alvo.movimento]);

  const definirContratante = useCallback<AparenciaCtx['definirContratante']>((a) => {
    setContratante(a ? deApi(a) : null);
  }, []);
  const definirPrevia = useCallback<AparenciaCtx['definirPrevia']>((a) => setPrevia(deApi(a)), []);
  const limparPrevia = useCallback(() => setPrevia(null), []);
  const set = useCallback<AparenciaCtx['set']>((p) => setPrevia((s) => ({ ...s, ...sanear(p) })), []);

  const settings = useMemo<Settings>(() => ({ ...alvo, theme: temaAplicado }), [alvo, temaAplicado]);

  const value = useMemo<AparenciaCtx>(
    () => ({
      settings,
      alvo,
      trocandoTema,
      emPrevia: previa !== null,
      definirContratante,
      definirPrevia,
      limparPrevia,
      set,
      reset: limparPrevia,
    }),
    [settings, alvo, trocandoTema, previa, definirContratante, definirPrevia, limparPrevia, set],
  );

  return (
    <Ctx.Provider value={value}>
      <MotionConfig reducedMotion={alvo.movimento === 'reduzida' ? 'always' : 'user'}>{children}</MotionConfig>
    </Ctx.Provider>
  );
}

/** API completa da aparência. */
export function useAparencia() {
  const c = useContext(Ctx);
  if (!c) throw new Error('AparenciaProvider ausente');
  return c;
}

/** Mesma interface do protótipo (`settings`, `set`, `reset`), para SceneBackground e LiveBackground. */
export const useSettings = useAparencia;

/** true quando o sistema pede menos movimento ou o contratante escolheu animações reduzidas. */
export function useReduce() {
  const sys = useReducedMotion();
  const { alvo } = useAparencia();
  return !!sys || alvo.movimento === 'reduzida';
}
