import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { animate, useIsPresent, type AnimationPlaybackControls } from 'motion/react';
import { useReduce, useSettings } from '../../shared/aparencia/AparenciaProvider';
import { cena as tempos } from '../tokens';
import type { Cena } from './cenas';
import { MAX_LUZES, Renderizador, type Cores, type Quadro } from './SceneShader';
import { registrarCena } from './sceneSync';
import { pegarCanvas, quandoOcioso } from './canvasReserva';

/*
 * Fundo de cena: roteiro da troca de tema. Um progresso p (0 = noite, 1 = dia) anda no tempo;
 * daqui sai cada quadro (céu, aurora, luzes da cidade, cada luminária, exposição, câmera, foco),
 * desenhado pelo shader. Sem WebGL 2, as duas fotos só esmaecem uma sobre a outra.
 */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const trecho = (p: number, [a, b]: [number, number]) => tempos.curva(clamp01((p - a) / (b - a)));
const sino = (p: number, [a, b]: [number, number]) => Math.sin(Math.PI * clamp01((p - a) / (b - a)));
const mistura = (a: number, b: number, k: number) => a + (b - a) * k;
/** Pseudoaleatório estável por luminária (a mesma lâmpada atrasa sempre igual). */
const semente = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function piscada(x: number) {
  const pts = tempos.piscada;
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    if (x <= x1) {
      const [x0, y0] = pts[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
    }
  }
  return pts[pts.length - 1][1];
}

function inicioDaLuz(c: Cena, i: number) {
  const f = tempos.fileiras;
  return f.inicio + c.luzes[i].fileira * f.passo + semente(i) * f.dispersao;
}

/** acendendo: sentido da sequência · completa: saiu do escuro total (partida de lâmpada e exposição) · simples: movimento reduzido */
type Modo = { acendendo: boolean; completa: boolean; simples: boolean };

type Camera = { foco: number; tempo: number; deriva: [number, number]; semente: number };

function montarQuadro(c: Cena, p: number, modo: Modo, cam: Camera): Quadro {
  const { acendendo, completa, simples } = modo;
  const f = tempos.fileiras;
  const luzes = new Float32Array(MAX_LUZES);
  c.luzes.slice(0, MAX_LUZES).forEach((_, i) => {
    const a = inicioDaLuz(c, i);
    if (simples) luzes[i] = p;
    else if (acendendo) {
      const x = clamp01((p - a) / f.acender);
      luzes[i] = tempos.curva(x) * (completa ? piscada(x) : 1);
    } else luzes[i] = tempos.curva(clamp01((p - a) / f.apagar));
  });
  const ceu = simples ? p : trecho(p, tempos.ceu);
  const curso = simples ? 0 : Math.sin(Math.PI * p);
  return {
    p,
    ceu,
    aurora: simples ? 0 : sino(p, tempos.aurora),
    cidade: 1 - (simples ? p : trecho(p, tempos.cidade)),
    luzes,
    exposicao: 1 + (completa && !simples ? tempos.exposicao.intensidade * sino(p, tempos.exposicao.trecho) : 0),
    zoom: tempos.camera.zoomBase + tempos.camera.aproximacao * curso,
    foco: cam.foco + tempos.camera.focoExtra * curso,
    deriva: cam.deriva,
    tempo: cam.tempo,
    semente: cam.semente,
  };
}

/** Mistura dois quadros (inversão no meio da sequência). */
function misturarQuadros(a: Quadro, b: Quadro, k: number): Quadro {
  const luzes = new Float32Array(MAX_LUZES);
  for (let i = 0; i < MAX_LUZES; i++) luzes[i] = mistura(a.luzes[i], b.luzes[i], k);
  return {
    ...b,
    ceu: mistura(a.ceu, b.ceu, k),
    aurora: mistura(a.aurora, b.aurora, k),
    cidade: mistura(a.cidade, b.cidade, k),
    luzes,
    exposicao: mistura(a.exposicao, b.exposicao, k),
    zoom: mistura(a.zoom, b.zoom, k),
    foco: mistura(a.foco, b.foco, k),
  };
}

/** Lê uma cor do tokens.css como [r, g, b] em 0–1, qualquer que seja o formato (rgb, oklch, color()). */
function corDoToken(el: HTMLElement, nome: string): [number, number, number] {
  const tmp = document.createElement('span');
  tmp.style.color = `var(${nome})`;
  el.appendChild(tmp);
  const css = getComputedStyle(tmp).color;
  tmp.remove();
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!ctx) return [1, 1, 1];
  ctx.canvas.width = ctx.canvas.height = 1;
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

type Pendente = { alvo: 0 | 1; ponto: number; resolve: (trocar: boolean) => void };

/** Promessa resolvida por fora (fotos carregadas). */
function adiada() {
  let resolver: () => void = () => {};
  const promessa = new Promise<void>((r) => (resolver = r));
  return { promessa, resolver };
}

/** Desfoque (px) → nível de mipmap do shader. */
const nivelDeFoco = (px: number) => Math.log2(1 + Math.max(0, px));

/** Desfoque (px) → teto de pixels do canvas: nítido usa mais resolução, desfocado economiza GPU. */
function pixelsParaFoco(px: number) {
  const { nitido, desfocado, desfocadoDesde } = tempos.canvasMaxPixels;
  const k = clamp01(px / desfocadoDesde);
  return Math.round(nitido + (desfocado - nitido) * k);
}

export function SceneBackground({ cena }: { cena: Cena }) {
  const { settings } = useSettings();
  const reduce = useReduce();
  const raiz = useRef<HTMLDivElement>(null);
  /** Onde o canvas reservado (canvasReserva.ts) é encaixado. */
  const lugarCanvas = useRef<HTMLDivElement>(null);
  const [webgl, setWebgl] = useState(() => Renderizador.suportado());
  /** Sobe quando o contexto WebGL é restaurado, para recriar o renderizador. */
  const [geracao, setGeracao] = useState(0);
  const alvoTema: 0 | 1 = settings.theme === 'light' ? 1 : 0;
  const deriva = settings.fundoAnimado && !reduce;
  const focoPx = settings.fundoFoco;
  /** false enquanto esta cena sai (esmaecimento cruzado para outro fundo): deixa de responder à troca de tema. */
  const presente = useIsPresent();
  /** Resolve quando as fotos estão no canvas: a troca de contratante espera por ela antes da sequência. */
  const pronta = useRef(adiada());

  // Estado mutável do roteiro (não causa render).
  const s = useRef({
    p: alvoTema as number,
    destino: alvoTema as 0 | 1,
    modo: { acendendo: true, completa: false, simples: false } as Modo,
    controle: null as AnimationPlaybackControls | null,
    pendentes: [] as Pendente[],
    rend: null as Renderizador | null,
    raf: 0,
    ultimo: 0,
    foco: nivelDeFoco(focoPx),
    pixels: pixelsParaFoco(focoPx),
    deriva,
    reduce,
    /** relógio da deriva e da água: só anda com o fundo animado (congela, não volta ao zero) */
    relogio: 0,
    relogioMarca: performance.now(),
    semente: 0,
    /** inversão no meio: quadro de onde saiu e quando */
    inversao: null as { de: Quadro; t0: number } | null,
    ultimoQuadro: null as Quadro | null,
  });
  s.current.deriva = deriva;
  s.current.reduce = reduce;

  /** Desenha um quadro agora (canvas) e atualiza --p para as tintas e o modo sem WebGL. */
  const desenhar = () => {
    const e = s.current;
    raiz.current?.style.setProperty('--p', e.p.toFixed(4));
    if (!e.rend) return;
    const agora = performance.now();
    if (e.deriva) e.relogio += (agora - e.relogioMarca) / 1000;
    e.relogioMarca = agora;
    if (e.controle) e.semente = (e.semente + 0.618034) % 1;
    const t = (e.relogio / tempos.deriva) * Math.PI * 2;
    const [ax, ay] = tempos.derivaAmplitude;
    const cam: Camera = {
      foco: e.foco,
      tempo: e.relogio,
      deriva: [Math.sin(t) * ax, Math.cos(t * 0.8) * ay],
      semente: e.semente,
    };
    let q = montarQuadro(cena, e.p, e.modo, cam);
    if (e.inversao) {
      const k = (agora - e.inversao.t0) / 1000 / tempos.inversao;
      if (k >= 1) e.inversao = null;
      else q = misturarQuadros(e.inversao.de, q, tempos.curva(k));
    }
    e.ultimoQuadro = q;
    e.rend.desenhar(q);
  };

  /** Laço de quadros: na troca até cena.trocaFps; em repouso, só com deriva, a cena.derivaFps. */
  const laco = (agora: number) => {
    const e = s.current;
    e.raf = 0;
    if (!e.rend) return;
    const animando = !!e.controle || !!e.inversao;
    const intervalo = 1000 / (animando ? tempos.trocaFps : tempos.derivaFps);
    if (agora - e.ultimo >= intervalo - 2) {
      e.ultimo = agora;
      desenhar();
    }
    if (animando || e.deriva) e.raf = requestAnimationFrame(laco);
  };
  const acordar = () => {
    const e = s.current;
    if (!e.raf && e.rend) e.raf = requestAnimationFrame(laco);
  };

  /** Resolve quem já pode trocar a interface (true) e quem foi substituído ou cancelado (false). */
  const resolverPendentes = (fim: 'andando' | 'chegou' | 'cancelou') => {
    const e = s.current;
    e.pendentes = e.pendentes.filter((x) => {
      if (fim === 'cancelou' || x.alvo !== e.destino) {
        x.resolve(false);
        return false;
      }
      const passou = x.alvo === 1 ? e.p >= x.ponto : e.p <= x.ponto;
      if (fim === 'chegou' || passou) {
        x.resolve(true);
        return false;
      }
      return true;
    });
  };

  /** Leva a cena até o alvo. Resolve true na hora de trocar o tema da interface; false se outra troca a substituiu. */
  const irPara = (alvo: 0 | 1) =>
    new Promise<boolean>((resolve) => {
      const e = s.current;
      const ponto = alvo === 1 ? tempos.trocaInterface.claro : tempos.trocaInterface.escuro;
      if (e.destino === alvo && (e.controle || e.p === alvo)) {
        e.pendentes.push({ alvo, ponto: e.reduce ? alvo : ponto, resolve });
        resolverPendentes(e.p === alvo ? 'chegou' : 'andando');
        return;
      }
      if (e.controle && e.ultimoQuadro) e.inversao = { de: e.ultimoQuadro, t0: performance.now() };
      e.controle?.stop();
      e.destino = alvo;
      resolverPendentes('andando'); // pedidos para o alvo antigo: substituídos
      e.pendentes.push({ alvo, ponto: e.reduce ? alvo : ponto, resolve });
      e.modo = { acendendo: alvo === 1, completa: alvo === 1 && e.p <= 0, simples: e.reduce };
      const total = e.reduce ? tempos.duracaoReduzida : alvo === 1 ? tempos.duracaoClaro : tempos.duracaoEscuro;
      e.controle = animate(e.p, alvo, {
        duration: total * Math.abs(alvo - e.p),
        ease: tempos.progressoEase,
        onUpdate: (v) => {
          e.p = v;
          resolverPendentes('andando');
        },
        onComplete: () => {
          e.controle = null;
          e.p = alvo;
          e.modo = { acendendo: alvo === 1, completa: false, simples: false };
          resolverPendentes('chegou');
          desenhar();
        },
      });
      acordar();
    });

  // Renderizador: cria, carrega as fotos e desenha o estado atual.
  useLayoutEffect(() => {
    const el = raiz.current;
    const lugar = lugarCanvas.current;
    if (!el) return;
    el.style.setProperty('--p', String(s.current.p));
    el.style.setProperty('--tinta', String(s.current.p));
    if (!webgl || !lugar) {
      pronta.current.resolver(); // sem WebGL 2: as fotos esmaecem uma sobre a outra, nada a esperar
      return;
    }
    /*
     * Diferença do protótipo: o renderizador nasce logo depois da primeira pintura, não dentro do commit.
     * Criar o contexto WebGL e medir o canvas custavam ~180 ms no mesmo quadro em que a casca monta
     * (login → Início, troca de contratante). O canvas vem da reserva (contexto já criado em tempo ocioso)
     * e surge esmaecendo quando as fotos chegam, como antes.
     */
    let adotado: HTMLCanvasElement | null = null;
    let rend: Renderizador | null = null;
    let ro: ResizeObserver | null = null;
    let espera: ReturnType<typeof setTimeout> | undefined;
    let quadro = requestAnimationFrame(() => {
      quadro = 0;
      espera = setTimeout(iniciar, 0);
    });
    // Perda de contexto (suspensão, troca de GPU): recria quando o navegador devolver.
    const perdeu = (ev: Event) => {
      ev.preventDefault();
      s.current.rend = null;
    };
    const voltou = () => setGeracao((g) => g + 1);

    function iniciar() {
      if (!el || !lugar) return;
      const cv = pegarCanvas((f) => quandoOcioso(f, tempos.aquecerGpu));
      adotado = cv;
      cv.className = 'scene-canvas';
      cv.style.opacity = '0';
      lugar.appendChild(cv);
      cv.addEventListener('webglcontextlost', perdeu);
      cv.addEventListener('webglcontextrestored', voltou);
      const cores: Cores = {
        gradeNoite: corDoToken(el, '--scene-grade-noite'),
        gradeDia: corDoToken(el, '--scene-grade-dia'),
        aurora: corDoToken(el, '--scene-aurora'),
        bloom: corDoToken(el, '--scene-bloom'),
        bloomCidade: corDoToken(el, '--scene-bloom-cidade'),
      };
      let novo: Renderizador;
      try {
        novo = new Renderizador(cv, cena, cores, {
          grao: tempos.grao,
          vinheta: tempos.vinheta,
          agua: tempos.agua,
          estrelas: tempos.estrelas,
          neblina: tempos.neblina,
        });
      } catch {
        setWebgl(false);
        return;
      }
      rend = novo;
      // Primeiro tamanho pelo ResizeObserver (logo abaixo), depois do layout do quadro: ler clientWidth aqui
      // forçava um layout síncrono da casca que acabou de montar.
      novo
        .carregar()
        .then((ok) => {
          if (!ok) return;
          s.current.rend = novo;
          desenhar();
          // Surge esmaecendo: nada de retângulo preto enquanto as fotos chegam.
          cv.style.transition = `opacity ${tempos.surgir}s`;
          cv.style.opacity = '1';
          acordar();
          pronta.current.resolver();
        })
        .catch(() => setWebgl(false));
      ro = new ResizeObserver(() => {
        novo.redimensionar(s.current.pixels);
        desenhar();
      });
      ro.observe(cv);
    }

    return () => {
      cancelAnimationFrame(quadro);
      clearTimeout(espera);
      if (adotado) {
        adotado.removeEventListener('webglcontextlost', perdeu);
        adotado.removeEventListener('webglcontextrestored', voltou);
        adotado.remove(); // fora da página: destruir() libera o contexto
      }
      if (!rend) return;
      ro?.disconnect();
      cancelAnimationFrame(s.current.raf);
      s.current.raf = 0;
      s.current.rend = null;
      rend.destruir();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cena, webgl, geracao]);

  // A troca de tema (motion/cena/trocarTema.ts) conversa com a cena por aqui, enquanto ela estiver presente.
  useEffect(() => {
    if (!presente) return;
    const sair = registrarCena(irPara, () => pronta.current.promessa);
    return () => {
      sair();
      const e = s.current;
      e.controle?.stop();
      e.controle = null;
      e.p = e.destino; // desmontado no meio: não fica preso a meio caminho
      e.inversao = null;
      resolverPendentes('cancelou');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cena, presente]);

  // Tema trocado por qualquer caminho (troca em vídeo, troca direta com movimento reduzido): a cena segue.
  useEffect(() => {
    void irPara(alvoTema);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alvoTema]);

  // Tintas de contraste acompanham o tema da interface, no mesmo esmaecimento dela.
  const tinta = useRef(alvoTema as number);
  useEffect(() => {
    const el = raiz.current;
    if (!el || tinta.current === alvoTema) return;
    const c = animate(tinta.current, alvoTema, {
      duration: (reduce ? tempos.duracaoReduzida : tempos.esmaecerInterface) * Math.abs(alvoTema - tinta.current),
      ease: tempos.esmaecerEase,
      onUpdate: (v) => {
        tinta.current = v;
        el.style.setProperty('--tinta', v.toFixed(4));
      },
    });
    return () => c.stop();
  }, [alvoTema, reduce]);

  // Foco do fundo (Aparência): muda o desfoque e a resolução do canvas na hora.
  useEffect(() => {
    const e = s.current;
    e.foco = nivelDeFoco(focoPx);
    e.pixels = pixelsParaFoco(focoPx);
    e.rend?.redimensionar(e.pixels);
    desenhar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focoPx]);

  // Deriva ligada/desligada: acorda o laço (ao desligar, a câmera congela onde está).
  useEffect(() => {
    s.current.relogioMarca = performance.now();
    if (deriva) acordar();
    else desenhar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deriva]);

  // Ferramenta de conferência (só em desenvolvimento): desenha um ponto qualquer da sequência.
  useEffect(() => {
    if (!import.meta.env.DEV || !presente) return;
    const w = window as unknown as { __cena?: unknown };
    w.__cena = {
      quadro: (p: number, acendendo = true) => {
        const e = s.current;
        e.controle?.stop();
        e.controle = null;
        e.inversao = null;
        e.p = p;
        e.modo = { acendendo, completa: acendendo, simples: false };
        resolverPendentes('cancelou');
        desenhar();
      },
    };
    return () => {
      delete w.__cena;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cena, presente]);

  const vars = { '--scene-ratio': cena.proporcao } as CSSProperties;

  return (
    <div ref={raiz} className="scene" style={vars} aria-hidden>
      {webgl ? (
        <div ref={lugarCanvas} className="contents" />
      ) : (
        <>
          <img className="scene-img" src={cena.noite} alt="" draggable={false} decoding="async" />
          <img className="scene-img scene-img-dia" src={cena.dia} alt="" draggable={false} decoding="async" />
        </>
      )}
      <div className="scene-tinta scene-tinta-noite" />
      <div className="scene-tinta scene-tinta-noite-forte" />
      <div className="scene-tinta scene-tinta-dia" />
      <div className="scene-tinta scene-tinta-dia-forte" />
    </div>
  );
}
