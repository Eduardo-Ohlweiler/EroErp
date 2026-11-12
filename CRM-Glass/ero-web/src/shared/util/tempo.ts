import { useEffect, useState } from 'react';

/** Segundos inteiros que faltam até `alvoMs` (arredonda para cima; nunca negativo). */
export function segundosAte(alvoMs: number | null | undefined, agoraMs: number): number {
  if (alvoMs == null || !Number.isFinite(alvoMs)) return 0;
  return Math.max(0, Math.ceil((alvoMs - agoraMs) / 1000));
}

/** 75 → "1:15"; 9 → "0:09". */
export function fmtMinSeg(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** ISO-8601 → milissegundos; ausente ou inválido → `padrao`. */
export function instanteMs(iso: string | null | undefined, padrao: number): number {
  const ms = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(ms) ? padrao : ms;
}

/**
 * Contagem regressiva em segundos até `alvoMs`, atualizada a cada meio segundo enquanto houver tempo.
 * `agora` permite usar o relógio do servidor (api.agoraServidor).
 */
export function useSegundosRestantes(alvoMs: number | null, agora: () => number = Date.now): number {
  const [restante, setRestante] = useState(() => segundosAte(alvoMs, agora()));
  useEffect(() => {
    const atualizar = () => setRestante(segundosAte(alvoMs, agora()));
    atualizar();
    if (alvoMs == null) return;
    const t = setInterval(atualizar, 500);
    return () => clearInterval(t);
  }, [alvoMs, agora]);
  return restante;
}

/** Data e hora atuais, relidas a cada `intervaloMs` (padrão: 1 min). Para saudação e data que não podem congelar. */
export function useAgora(intervaloMs = 60_000): Date {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), intervaloMs);
    return () => clearInterval(t);
  }, [intervaloMs]);
  return agora;
}
