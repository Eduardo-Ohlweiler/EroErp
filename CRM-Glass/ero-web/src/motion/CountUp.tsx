import { useEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { useReduzirMovimento } from './reduzir';
import { dados, ease } from './tokens';

/** Número que conta até o valor ao entrar na tela (só na primeira exibição). */
export function CountUp({
  value,
  format = (v: number) => String(Math.round(v)),
  duration = dados.contagem.duracao,
  delay = dados.contagem.atraso,
  className,
}: {
  value: number;
  format?: (v: number) => string;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReduzirMovimento();
  const fmt = useRef(format);
  fmt.current = format;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduce) {
      node.textContent = fmt.current(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      delay,
      ease: ease.out,
      onUpdate: (v) => {
        node.textContent = fmt.current(v);
      },
    });
    return () => controls.stop();
  }, [value, reduce, duration, delay]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {format(reduce ? value : 0)}
    </span>
  );
}
