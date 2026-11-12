import { useLayoutEffect, useRef, useState } from 'react';

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const int = new Intl.NumberFormat('pt-BR');

export const fmtBRL = (v: number) => brl.format(Math.round(v));
export const fmtCompactBRL = (v: number) => `R$ ${compact.format(v)}`;
export const fmtInt = (v: number) => int.format(Math.round(v));
export const fmtPct = (v: number, d = 1) =>
  `${v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })}%`;

export const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/** Mede a largura/altura de um elemento (ignora transforms, ideal para gráficos). */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

const dataExtenso = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** "quarta-feira, 11 de novembro de 2026" */
export const fmtDataExtenso = (d: Date) => dataExtenso.format(d);

/** Saudação pela hora local: Bom dia (5h–11h), Boa tarde (12h–17h), Boa noite (18h–4h). */
export function saudacao(d: Date) {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** "Ana Paula Ribeiro" → "Ana" */
export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? '';
