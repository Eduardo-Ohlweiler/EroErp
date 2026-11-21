import type { CSSProperties } from 'react';

/**
 * Cor de registro (docs/07 §3.2, "Cor de registro"): a cor que o usuário escolhe para um registro (a filial) é **dado**,
 * não pele. Ela vem do banco como `#RRGGBB` e só o kit a aplica (`TCor`, `TCorMarca`): numa variável CSS
 * (`--cor-do-registro`) lida por `bg-[var(--cor-do-registro)]`, só na bolinha. As 8 sugeridas são tokens
 * (`--cor-registro-1` … `--cor-registro-8`, tokens.css); nenhum hex mora em `.tsx`.
 */

/** O formato aceito: `#RRGGBB`. O mesmo do `@Pattern` do DTO e do CHECK do banco. */
export const FORMATO_DA_COR = /^#[0-9A-Fa-f]{6}$/;

/** `#RRGGBB` em maiúsculas, ou `null` quando o valor não é uma cor válida (nunca vai para o CSS). Função pura. */
export function normalizarCor(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const v = valor.trim();
  return FORMATO_DA_COR.test(v) ? v.toUpperCase() : null;
}

/** As 8 sugeridas, na ordem do 2.0: o nome (o que se lê ao lado da bolinha) e o token que guarda o hex. */
export const CORES_SUGERIDAS = [
  { nome: 'Azul', token: '--cor-registro-1' },
  { nome: 'Verde', token: '--cor-registro-2' },
  { nome: 'Âmbar', token: '--cor-registro-3' },
  { nome: 'Vermelho', token: '--cor-registro-4' },
  { nome: 'Violeta', token: '--cor-registro-5' },
  { nome: 'Rosa', token: '--cor-registro-6' },
  { nome: 'Turquesa', token: '--cor-registro-7' },
  { nome: 'Ardósia', token: '--cor-registro-8' },
] as const;

/** Uma sugerida com o hex lido do token (`null` se o CSS ainda não chegou ou o token sumiu). */
export type CorSugerida = { nome: string; token: string; hex: string | null };

/** Lê um token do `<html>`. Fora do navegador (teste sem stub), devolve vazio. */
function lerDoDocumento(): (token: string) => string {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return () => '';
  const estilo = getComputedStyle(document.documentElement);
  return (token) => estilo.getPropertyValue(token);
}

/**
 * As sugeridas com o hex de cada uma, lido de `getComputedStyle(document.documentElement)` (os tokens são os mesmos
 * nos dois temas). `ler` substitui a leitura (teste).
 */
export function lerCoresSugeridas(ler: (token: string) => string = lerDoDocumento()): CorSugerida[] {
  return CORES_SUGERIDAS.map((c) => ({ nome: c.nome, token: c.token, hex: normalizarCor(ler(c.token)) }));
}

/** Índice da sugerida com esse valor (sem diferença de caixa), ou -1. Função pura. */
export function indiceDaSugerida(valor: string | null | undefined, sugeridas: readonly CorSugerida[]): number {
  const cor = normalizarCor(valor);
  if (!cor) return -1;
  return sugeridas.findIndex((s) => s.hex === cor);
}

/** Como a cor se lê: o nome da sugerida ("Azul"), "Outra (#A1B2C3)", ou vazio (sem cor válida). Função pura. */
export function rotuloDaCor(valor: string | null | undefined, sugeridas: readonly CorSugerida[]): string {
  const cor = normalizarCor(valor);
  if (!cor) return '';
  const i = indiceDaSugerida(cor, sugeridas);
  return i >= 0 ? sugeridas[i].nome : `Outra (${cor})`;
}

/**
 * O `style` da bolinha: a cor válida vai para `--cor-do-registro`; fora do formato, a bolinha neutra
 * (`--cor-registro-vazia`). Também aceita o token de uma sugerida (`var(--cor-registro-N)`). Função pura.
 */
export function estiloDaCor(cor: string | null | undefined, token?: string): CSSProperties {
  const valida = normalizarCor(cor);
  const valor = token ? `var(${token})` : (valida ?? 'var(--cor-registro-vazia)');
  return { '--cor-do-registro': valor } as CSSProperties;
}

/** A bolinha: o anel `--line-strong` desenhado sobre o fundo da página (bg-clip-padding), a cor só por dentro. */
export const CLASSE_DA_BOLINHA = 'rounded-full border-line-strong bg-clip-padding bg-[var(--cor-do-registro)]';
