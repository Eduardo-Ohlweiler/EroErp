/**
 * Aparência: tipos do front, contrato da API e a tradução entre os dois.
 *
 * Regra: nada que vem da API vai cru para o CSS. Tudo passa por lista branca (enum → id do front)
 * e por limites (números presos à faixa permitida). Valor desconhecido é descartado e
 * vale a camada de baixo (contratante → padrão do sistema).
 */

/* ---------------- Front (o que o CSS e o fundo entendem) ---------------- */
export type Theme = 'dark' | 'light';
export type Accent = 'violeta' | 'azul' | 'laranja' | 'esmeralda' | 'rosa' | 'ambar';
export type Fundo = 'orbs' | 'aurora' | 'ondas' | 'minimo' | 'escritorio' | 'cidade' | 'marina' | 'expediente' | 'coworking';
export type Movimento = 'completa' | 'reduzida';

export type Settings = {
  theme: Theme;
  accent: Accent;
  fundo: Fundo;
  fundoAnimado: boolean;
  /** desfoque do vidro, em px (0–40) */
  blur: number;
  /** desfoque da foto nos fundos de cena, em px (0 = nítido, até 10) */
  fundoFoco: number;
  movimento: Movimento;
};

/** Padrão do sistema: vale antes do login e quando o contratante não define algo válido. */
export const PADRAO_SISTEMA: Settings = {
  theme: 'dark',
  accent: 'violeta',
  fundo: 'orbs',
  fundoAnimado: true,
  blur: 12,
  fundoFoco: 3,
  movimento: 'completa',
};
/** Nome antigo (protótipo), mantido para quem portar código de lá. */
export const DEFAULT_SETTINGS = PADRAO_SISTEMA;

export const LIMITES = {
  vidro: { min: 0, max: 40, passo: 1 },
  foco: { min: 0, max: 10, passo: 0.5 },
} as const;

export const DESTAQUES: { id: Accent; nome: string }[] = [
  { id: 'violeta', nome: 'Violeta' },
  { id: 'azul', nome: 'Azul' },
  { id: 'laranja', nome: 'Laranja' },
  { id: 'esmeralda', nome: 'Esmeralda' },
  { id: 'rosa', nome: 'Rosa' },
  { id: 'ambar', nome: 'Âmbar' },
];

/**
 * Fundos que o front sabe desenhar. Cena nova (inclusive exclusiva, ex.: EXCLUSIVA_01 → 'exclusiva-01')
 * entra aqui, no tipo `Fundo`, em `motion/cena/cenas.ts` e no enum `Fundo.java` (ver docs/06).
 */
export const FUNDOS: readonly Fundo[] = [
  'orbs',
  'aurora',
  'ondas',
  'minimo',
  'escritorio',
  'cidade',
  'marina',
  'expediente',
  'coworking',
];

/* ---------------- API (contrato do backend: AparenciaDto) ---------------- */
export type TemaApi = 'ESCURO' | 'CLARO';
export type AnimacoesApi = 'COMPLETAS' | 'REDUZIDAS';
export type FundoApi = 'ORBS' | 'AURORA' | 'ONDAS' | 'MINIMO' | 'ESCRITORIO' | 'CIDADE' | 'MARINA' | 'EXPEDIENTE' | 'COWORKING';

export type AparenciaApi = {
  corDestaque: Accent;
  temaPadrao: TemaApi;
  fundo: FundoApi;
  fundoAnimado: boolean;
  vidroDesfoque: number;
  fundoFoco: number;
  animacoes: AnimacoesApi;
};

/** Item do catálogo `GET /api/tenants/fundos` (FundoCatalogoDto). */
export type FundoCatalogo = {
  codigo: string;
  rotulo: string;
  tipo: 'VIVO' | 'CENA';
  exclusiva: boolean;
};

/* ---------------- Limites ---------------- */
const numero = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

/** Desfoque do vidro: inteiro de 0 a 40. */
export function prenderVidro(v: unknown): number | null {
  const n = numero(v);
  if (n === null) return null;
  return Math.min(LIMITES.vidro.max, Math.max(LIMITES.vidro.min, Math.round(n)));
}

/** Foco do fundo: 0 a 10, em passos de 0,5. */
export function prenderFoco(v: unknown): number | null {
  const n = numero(v);
  if (n === null) return null;
  const passo = LIMITES.foco.passo;
  return Math.min(LIMITES.foco.max, Math.max(LIMITES.foco.min, Math.round(n / passo) * passo));
}

/* ---------------- Enum ↔ id ---------------- */
const TEMAS: Record<TemaApi, Theme> = { ESCURO: 'dark', CLARO: 'light' };
const ANIMACOES: Record<AnimacoesApi, Movimento> = { COMPLETAS: 'completa', REDUZIDAS: 'reduzida' };
const temProp = <T extends object>(o: T, k: PropertyKey): k is keyof T => Object.prototype.hasOwnProperty.call(o, k);

/** 'MARINA' → 'marina'; 'EXCLUSIVA_01' → 'exclusiva-01'. Código fora da lista branca → null. */
export function fundoDeCodigo(codigo: unknown): Fundo | null {
  if (typeof codigo !== 'string') return null;
  const id = codigo.trim().toLowerCase().replace(/_/g, '-');
  return (FUNDOS as readonly string[]).includes(id) ? (id as Fundo) : null;
}

/** 'marina' → 'MARINA'. */
export function codigoDeFundo(fundo: Fundo): FundoApi {
  return fundo.toUpperCase().replace(/-/g, '_') as FundoApi;
}

export function temaDeApi(v: unknown): Theme | null {
  return typeof v === 'string' && temProp(TEMAS, v) ? TEMAS[v] : null;
}

export function destaqueDeApi(v: unknown): Accent | null {
  return typeof v === 'string' && DESTAQUES.some((d) => d.id === v) ? (v as Accent) : null;
}

/**
 * Aparência da API (ou parte dela) → ajustes do front, só com o que passou na lista branca e nos limites.
 * Campos inválidos ou ausentes ficam de fora (vale a camada de baixo).
 */
export function deApi(a: unknown): Partial<Settings> {
  if (!a || typeof a !== 'object') return {};
  const o = a as Record<string, unknown>;
  const s: Partial<Settings> = {};
  const theme = temaDeApi(o.temaPadrao);
  if (theme) s.theme = theme;
  const accent = destaqueDeApi(o.corDestaque);
  if (accent) s.accent = accent;
  const fundo = fundoDeCodigo(o.fundo);
  if (fundo) s.fundo = fundo;
  if (typeof o.fundoAnimado === 'boolean') s.fundoAnimado = o.fundoAnimado;
  const blur = prenderVidro(o.vidroDesfoque);
  if (blur !== null) s.blur = blur;
  const foco = prenderFoco(o.fundoFoco);
  if (foco !== null) s.fundoFoco = foco;
  if (typeof o.animacoes === 'string' && temProp(ANIMACOES, o.animacoes)) s.movimento = ANIMACOES[o.animacoes];
  return s;
}

/** Ajustes do front → corpo da API (AparenciaDto). */
export function paraApi(s: Settings): AparenciaApi {
  return {
    corDestaque: s.accent,
    temaPadrao: s.theme === 'light' ? 'CLARO' : 'ESCURO',
    fundo: codigoDeFundo(s.fundo),
    fundoAnimado: s.fundoAnimado,
    vidroDesfoque: s.blur,
    fundoFoco: s.fundoFoco,
    animacoes: s.movimento === 'reduzida' ? 'REDUZIDAS' : 'COMPLETAS',
  };
}

/** Aparência padrão do sistema no formato da API (ex.: valor inicial do formulário de contratante). */
export const APARENCIA_PADRAO: AparenciaApi = paraApi(PADRAO_SISTEMA);

/** Sanitiza ajustes já no formato do front (ex.: `set()` de compatibilidade). */
export function sanear(p: Partial<Settings>): Partial<Settings> {
  return deApi({
    temaPadrao: p.theme === undefined ? undefined : p.theme === 'light' ? 'CLARO' : p.theme === 'dark' ? 'ESCURO' : null,
    corDestaque: p.accent,
    fundo: p.fundo,
    fundoAnimado: p.fundoAnimado,
    vidroDesfoque: p.blur,
    fundoFoco: p.fundoFoco,
    animacoes: p.movimento === undefined ? undefined : p.movimento === 'reduzida' ? 'REDUZIDAS' : p.movimento === 'completa' ? 'COMPLETAS' : null,
  });
}
