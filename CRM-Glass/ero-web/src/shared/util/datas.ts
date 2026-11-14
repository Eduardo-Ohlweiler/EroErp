/**
 * Datas de calendário (`AAAA-MM-DD`), sem fuso: o dia que a pessoa escolheu, não um instante. Usadas pelo
 * `Calendario` (design-system/ui) e pelo `TDate` do kit. Tudo puro e em pt-BR; para exibir uma data salva, o
 * `formatarData` de `format.ts`; para "hoje", o `hojeIso`.
 */

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const BR = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export type PartesData = { ano: number; mes: number; dia: number };

const dois = (n: number) => String(n).padStart(2, '0');

/** Dias do mês (`mes` de 0 a 11). */
export function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes + 1, 0).getDate();
}

/** `{ ano, mes (0–11), dia }` de uma data `AAAA-MM-DD` válida; `null` se não for uma data que existe. */
export function partesIso(iso?: string | null): PartesData | null {
  const m = iso ? ISO.exec(iso) : null;
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]) - 1;
  const dia = Number(m[3]);
  if (ano < 1 || mes < 0 || mes > 11 || dia < 1 || dia > diasNoMes(ano, mes)) return null;
  return { ano, mes, dia };
}

/** `AAAA-MM-DD` das partes (sem conferir; use com partes que vieram de `partesIso` ou de `Date`). */
export function paraIso({ ano, mes, dia }: PartesData): string {
  return `${String(ano).padStart(4, '0')}-${dois(mes + 1)}-${dois(dia)}`;
}

/** `AAAA-MM-DD` → `DD/MM/AAAA`; vazio ou inválido → `''`. */
export function isoParaBr(iso?: string | null): string {
  const p = partesIso(iso);
  return p ? `${dois(p.dia)}/${dois(p.mes + 1)}/${String(p.ano).padStart(4, '0')}` : '';
}

/** `DD/MM/AAAA` → `AAAA-MM-DD`, só se a data existe (31/02 não); senão `null`. */
export function brParaIso(br: string): string | null {
  const m = BR.exec(br.trim());
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  return partesIso(iso) ? iso : null;
}

/** Máscara de digitação: só dígitos, até 8, pontuados como `DD/MM/AAAA` enquanto se digita. */
export function mascararData(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Soma (ou subtrai) dias a uma data válida. */
export function somarDias(iso: string, dias: number): string {
  const p = partesIso(iso);
  if (!p) return iso;
  const d = new Date(p.ano, p.mes, p.dia + dias);
  return paraIso({ ano: d.getFullYear(), mes: d.getMonth(), dia: d.getDate() });
}

/** Soma meses mantendo o dia, encostado no último dia do mês de destino (31/01 + 1 mês → 28 ou 29/02). */
export function somarMeses(iso: string, meses: number): string {
  const p = partesIso(iso);
  if (!p) return iso;
  const alvo = new Date(p.ano, p.mes + meses, 1);
  const ano = alvo.getFullYear();
  const mes = alvo.getMonth();
  return paraIso({ ano, mes, dia: Math.min(p.dia, diasNoMes(ano, mes)) });
}

/** Dia da semana (0 = domingo). */
export function diaDaSemana(iso: string): number {
  const p = partesIso(iso);
  return p ? new Date(p.ano, p.mes, p.dia).getDay() : 0;
}

/**
 * As seis semanas que o calendário mostra para o mês (`mes` de 0 a 11): de domingo a sábado, começando no domingo
 * da semana do dia 1 (a semana no Brasil começa no domingo). Sempre 6 × 7, para a grade não mudar de altura.
 */
export function semanasDoMes(ano: number, mes: number): string[][] {
  const primeiro = paraIso({ ano, mes, dia: 1 });
  let dia = somarDias(primeiro, -diaDaSemana(primeiro));
  const semanas: string[][] = [];
  for (let s = 0; s < 6; s++) {
    const semana: string[] = [];
    for (let d = 0; d < 7; d++) {
      semana.push(dia);
      dia = somarDias(dia, 1);
    }
    semanas.push(semana);
  }
  return semanas;
}

/** A data está entre `min` e `max` (inclusive; limites vazios não limitam). Comparação de texto ISO. */
export function dentroDosLimites(iso: string, min?: string, max?: string): boolean {
  return (!min || iso >= min) && (!max || iso <= max);
}

const MES_ANO = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const POR_EXTENSO = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** "novembro de 2026". */
export function nomeDoMes(ano: number, mes: number): string {
  return MES_ANO.format(new Date(ano, mes, 1));
}

/** "sábado, 14 de novembro de 2026" (nome acessível do dia no calendário). */
export function dataPorExtenso(iso: string): string {
  const p = partesIso(iso);
  return p ? POR_EXTENSO.format(new Date(p.ano, p.mes, p.dia)) : '';
}

/** Cabeçalho da grade: a letra e o nome do dia, de domingo a sábado. */
export const DIAS_DA_SEMANA: readonly { curto: string; nome: string }[] = [
  { curto: 'D', nome: 'domingo' },
  { curto: 'S', nome: 'segunda-feira' },
  { curto: 'T', nome: 'terça-feira' },
  { curto: 'Q', nome: 'quarta-feira' },
  { curto: 'Q', nome: 'quinta-feira' },
  { curto: 'S', nome: 'sexta-feira' },
  { curto: 'S', nome: 'sábado' },
];
