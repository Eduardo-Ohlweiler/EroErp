import { useEffect, useState } from 'react';
import { Gauge } from 'lucide-react';
import { Button } from '../ui';

/*
 * Medidor de quadros por segundo (só no catálogo, em desenvolvimento).
 * Mede o intervalo entre requestAnimationFrame: é o ritmo em que a página consegue produzir quadros.
 * `window.__medirFps(segundos)` devolve o resumo, para medir por automação (DevTools Protocol).
 */

export type ResumoFps = {
  segundos: number;
  quadros: number;
  /** média de quadros por segundo */
  media: number;
  /** fps do 1 % de quadros mais lentos */
  baixo1: number;
  /** quadros acima de 33 ms (abaixo de 30 fps) e acima de 50 ms */
  acima33ms: number;
  acima50ms: number;
  /** maior intervalo entre quadros (ms) */
  pior: number;
};

export function medirFps(segundos: number): Promise<ResumoFps> {
  return new Promise((resolve) => {
    const intervalos: number[] = [];
    let ultimo = performance.now();
    const fim = ultimo + segundos * 1000;
    const quadro = (agora: number) => {
      intervalos.push(agora - ultimo);
      ultimo = agora;
      if (agora < fim) requestAnimationFrame(quadro);
      else {
        const total = intervalos.reduce((a, b) => a + b, 0);
        const ordenados = [...intervalos].sort((a, b) => b - a);
        const n1 = Math.max(1, Math.floor(ordenados.length / 100));
        const lentos = ordenados.slice(0, n1).reduce((a, b) => a + b, 0) / n1;
        resolve({
          segundos,
          quadros: intervalos.length,
          media: +(1000 / (total / intervalos.length)).toFixed(1),
          baixo1: +(1000 / lentos).toFixed(1),
          acima33ms: intervalos.filter((i) => i > 33.4).length,
          acima50ms: intervalos.filter((i) => i > 50).length,
          pior: +ordenados[0].toFixed(1),
        });
      }
    };
    requestAnimationFrame((t) => {
      ultimo = t;
      requestAnimationFrame(quadro);
    });
  });
}

if (typeof window !== 'undefined') (window as unknown as { __medirFps: typeof medirFps }).__medirFps = medirFps;

/** Chip flutuante com o fps ao vivo e um botão para medir 5 s. */
export function MedidorFps() {
  const [ao, setAo] = useState(0);
  const [resumo, setResumo] = useState<ResumoFps | null>(null);
  const [medindo, setMedindo] = useState(false);

  useEffect(() => {
    let raf = 0;
    let n = 0;
    let marca = performance.now();
    const laco = (t: number) => {
      n++;
      if (t - marca >= 500) {
        setAo(Math.round((n * 1000) / (t - marca)));
        n = 0;
        marca = t;
      }
      raf = requestAnimationFrame(laco);
    };
    raf = requestAnimationFrame(laco);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fixed left-4 bottom-4 z-[70] glass-solid rounded-2xl px-3 py-2 text-xs flex items-center gap-3 shadow-lg">
      <Gauge className="size-4 text-accent-text" aria-hidden />
      <span className="tabular-nums font-semibold w-14">{ao} fps</span>
      {resumo && (
        <span className="text-muted tabular-nums">
          5 s: média {resumo.media} · 1 % {resumo.baixo1} · {resumo.acima33ms} quadros &gt; 33 ms
        </span>
      )}
      <Button
        size="sm"
        disabled={medindo}
        onClick={() => {
          setMedindo(true);
          void medirFps(5).then((r) => {
            setResumo(r);
            setMedindo(false);
          });
        }}
      >
        {medindo ? 'Medindo…' : 'Medir 5 s'}
      </Button>
    </div>
  );
}
