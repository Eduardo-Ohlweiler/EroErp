import { EVENTOS_BASE, type EventoBase, type TipoEvento } from './mock';
import { hash } from '../lib/utils';

export type Evento = Omit<EventoBase, 'off'> & { id: string; data: Date };

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
/** Segunda-feira da semana da data. */
export const startOfWeek = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));

const HOJE = startOfDay(new Date());
const DIAS_REAIS = new Map<number, EventoBase[]>();
for (const e of EVENTOS_BASE) {
  const k = addDays(HOJE, e.off).getTime();
  DIAS_REAIS.set(k, [...(DIAS_REAIS.get(k) ?? []), e]);
}

/**
 * Compromissos de um dia. Perto de hoje usa a lista fixa; longe de hoje gera
 * compromissos determinísticos a partir da mesma lista, só para o calendário não ficar vazio.
 */
export function eventosDoDia(data: Date): Evento[] {
  const d = startOfDay(data);
  const reais = DIAS_REAIS.get(d.getTime());
  let base: EventoBase[];
  if (reais) base = reais;
  else if (Math.abs(d.getTime() - HOJE.getTime()) <= 6 * 86400000) base = [];
  else {
    const seed = hash(d.toDateString());
    const fimDeSemana = d.getDay() === 0 || d.getDay() === 6;
    const qtd = fimDeSemana ? seed % 2 : 1 + (seed % 3);
    const usados = new Set<number>();
    base = [];
    for (let k = 0; k < qtd; k++) {
      const e = EVENTOS_BASE[(seed + k * 7) % EVENTOS_BASE.length];
      if (usados.has(e.inicio)) continue;
      usados.add(e.inicio);
      base.push(e);
    }
  }
  return base
    .map((e, i) => ({ ...e, id: `${d.getTime()}-${i}`, data: d }))
    .sort((a, b) => a.inicio - b.inicio);
}

export const fmtHora = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

export const TIPOS_ORDEM: TipoEvento[] = ['reuniao', 'ligacao', 'visita', 'demo', 'interno'];
