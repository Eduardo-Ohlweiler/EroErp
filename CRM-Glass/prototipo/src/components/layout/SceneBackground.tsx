import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import { animate } from 'motion/react';
import { useReduce, useSettings } from '../../theme/settings';
import { cena as tempos } from '../../motion/tokens';
import { cn } from '../../lib/utils';
import type { Cena } from './cenas';

/*
 * Fundo fotográfico que acompanha o tema.
 * Progresso p: 0 = noite (escuro), 1 = dia (claro). Camadas, de baixo para cima:
 *   foto noite → foto dia mascarada (cada luminária revela a área em volta) → brilhos → tintas.
 * Por quadro mudam só variáveis CSS no contêiner: --p, --jan, --amb, --l0…, --g0… (cena) e --tinta (contraste).
 * As tintas seguem o tema em seguida (tempos.tinta), não a sequência: o texto do tema novo
 * nunca fica sobre a foto do tema antigo sem proteção.
 */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const trecho = (p: number, a: number, b: number) => tempos.curva(clamp01((p - a) / (b - a)));

/** Interpolação linear entre os pontos da piscada. */
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

function inicioDaLuz(i: number, total: number) {
  const { inicio, fim } = tempos.luzes;
  return total <= 1 ? inicio : inicio + ((fim - inicio) * i) / (total - 1);
}

/**
 * Grava o estado da cena para o progresso p.
 * `piscar`: só quando acende a partir do escuro total; invertendo no meio, o brilho segue a curva suave (sem saltos).
 * `simples`: movimento reduzido — tudo esmaece junto; o estado final é o mesmo do caminho completo.
 */
function aplicar(el: HTMLElement, c: Cena, p: number, piscar: boolean, simples: boolean) {
  const s = el.style;
  const fim = simples ? p : trecho(p, tempos.preencher[0], tempos.preencher[1]);
  s.setProperty('--p', p.toFixed(4));
  s.setProperty('--jan', (simples ? p : trecho(p, tempos.janela[0], tempos.janela[1])).toFixed(4));
  let soma = 0;
  c.luzes.forEach((_, i) => {
    const l = simples ? p : tempos.curva(clamp01((p - inicioDaLuz(i, c.luzes.length)) / tempos.luzes.luz));
    const acesa = simples ? p : piscar ? piscada(l) : l;
    soma += l;
    s.setProperty(`--l${i}`, l.toFixed(4));
    s.setProperty(`--g${i}`, (acesa * (1 - (1 - tempos.brilhoFinal) * fim)).toFixed(4));
  });
  // Cada luz acesa também clareia um pouco o ambiente todo, para não sobrar mancha escura entre elas.
  const ambiente = Math.max(fim, (soma / Math.max(c.luzes.length, 1)) * tempos.ambiente);
  s.setProperty('--amb', ambiente.toFixed(4));
}

/** Cor da máscara com opacidade dada por uma variável 0–1. */
const opaco = (v: string) => `color-mix(in srgb, var(--scene-mask) calc(var(${v}) * 100%), transparent)`;

function mascaraDoDia(c: Cena) {
  const { fator, min, max, achatamento } = c.ajuste.alcance;
  const camadas = c.luzes.map((l, i) => {
    const rx = Math.min(Math.max(l.w * fator, min), max);
    const ry = rx * c.proporcao * achatamento;
    return `radial-gradient(ellipse calc(var(--l${i}) * ${rx}% + 0.1%) calc(var(--l${i}) * ${ry.toFixed(1)}% + 0.1%) at ${l.x}% ${l.y}%, ${opaco(`--l${i}`)} 30%, transparent 100%)`;
  });
  const j = c.janela;
  camadas.push(
    `radial-gradient(ellipse calc(var(--jan) * ${j.rx}% + 0.1%) calc(var(--jan) * ${j.ry}% + 0.1%) at ${j.x}% ${j.y}%, ${opaco('--jan')} 45%, transparent 100%)`,
  );
  camadas.push(`linear-gradient(${opaco('--amb')}, ${opaco('--amb')})`);
  return camadas.join(', ');
}

export function SceneBackground({ cena }: { cena: Cena }) {
  const { settings } = useSettings();
  const reduce = useReduce();
  const raiz = useRef<HTMLDivElement>(null);
  const alvo = settings.theme === 'light' ? 1 : 0;
  const p = useRef(alvo);
  const tinta = useRef(alvo);

  const mascara = useMemo(() => mascaraDoDia(cena), [cena]);

  // Primeiro quadro já no estado do tema atual, sem animação.
  useLayoutEffect(() => {
    const el = raiz.current;
    if (!el) return;
    aplicar(el, cena, p.current, false, false);
    el.style.setProperty('--tinta', String(tinta.current));
  }, [cena]);

  // Tintas de contraste: acompanham o tema logo.
  useEffect(() => {
    const el = raiz.current;
    if (!el || tinta.current === alvo) return;
    const controle = animate(tinta.current, alvo, {
      duration: (reduce ? tempos.duracaoReduzida : tempos.tinta) * Math.abs(alvo - tinta.current),
      ease: tempos.tintaEase,
      onUpdate: (v) => {
        tinta.current = v;
        el.style.setProperty('--tinta', v.toFixed(4));
      },
    });
    return () => controle.stop();
  }, [alvo, reduce]);

  // Cena: percorre o caminho do ponto em que está até o alvo.
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const final = () => aplicar(el, cena, alvo, false, false);
    if (p.current === alvo) {
      final();
      return;
    }
    const piscar = p.current <= 0 && alvo === 1;
    const total = reduce ? tempos.duracaoReduzida : tempos.duracao;
    const controle = animate(p.current, alvo, {
      duration: total * Math.abs(alvo - p.current),
      ease: tempos.progressoEase,
      onUpdate: (v) => {
        p.current = v;
        aplicar(el, cena, v, piscar, reduce);
      },
      onComplete: final,
    });
    return () => controle.stop();
  }, [alvo, cena, reduce]);

  const vars = { '--scene-ratio': cena.proporcao } as CSSProperties;
  const { brilho } = cena.ajuste;

  return (
    <div ref={raiz} className="scene" style={vars} aria-hidden>
      <div className="scene-box">
        <div
          className={cn('scene-drift', (!settings.fundoAnimado || reduce) && 'paused')}
          style={{ animationDuration: `${tempos.deriva}s` }}
        >
          {cena.noite ? (
            <img className="scene-img" src={cena.noite} alt="" draggable={false} decoding="async" />
          ) : (
            <>
              <img className="scene-img scene-noite-derivada" src={cena.dia} alt="" draggable={false} decoding="async" />
              <div className="scene-noite-tinta" />
            </>
          )}
          <img
            className="scene-img"
            src={cena.dia}
            alt=""
            draggable={false}
            decoding="async"
            style={{ maskImage: mascara, WebkitMaskImage: mascara }}
          />
          {cena.luzes.map((l, i) => (
            <span
              key={i}
              className="scene-glow"
              style={{
                left: `${l.x}%`,
                top: `${l.y}%`,
                width: `${l.w * brilho.largura}%`,
                height: `${l.w * brilho.altura * cena.proporcao}%`,
                opacity: `var(--g${i})`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="scene-tinta scene-tinta-noite" />
      <div className="scene-tinta scene-tinta-noite-forte" />
      <div className="scene-tinta scene-tinta-dia" />
      <div className="scene-tinta scene-tinta-dia-forte" />
    </div>
  );
}
