/**
 * Formatação e máscaras em pt-BR, portadas do EroErp 2.0 (`ero/src/utils/format.ts`).
 *
 * A API manda e recebe ISO-8601 e números crus; o front só formata na exibição. As máscaras ficam no kit
 * (`TEntry mascara=...`): a tela nunca chama máscara no `onChange`.
 *
 * Diferença do 2.0: **CNPJ alfanumérico** (Receita Federal, a partir de julho de 2026). Os 12 primeiros caracteres
 * são `[0-9A-Z]`, os 2 últimos (dígitos verificadores) continuam numéricos: "12.ABC.345/01DE-35". A ero-api já
 * aceita; grava-se sem máscara, em maiúsculas ("12ABC34501DE35").
 */

/** O traço que marca ausência na interface (e que o `TAuditoria` mostra em meia linha sem dado). */
export const AUSENTE = '—';

const DATA_HORA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const DATA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

/** Instante ISO (createdAt, updatedAt) em pt-BR, no fuso de quem lê. Ausente vira travessão. */
export function formatarDataHora(iso?: string | null): string {
  if (!iso) return AUSENTE;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? AUSENTE : DATA_HORA.format(d);
}

/**
 * Data em pt-BR. `AAAA-MM-DD` é dia do calendário, não instante: vira meia-noite LOCAL (com `new Date('2026-08-29')`
 * o JavaScript leria meia-noite UTC e, no Brasil, mostraria o dia anterior).
 */
export function formatarData(iso?: string | null): string {
  if (!iso) return AUSENTE;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return Number.isNaN(d.getTime()) ? AUSENTE : DATA.format(d);
}

/** Hoje, `AAAA-MM-DD`, no fuso de quem usa (o `toISOString` daria amanhã das 21h à meia-noite no Brasil). */
export function hojeIso(): string {
  return new Date().toLocaleDateString('sv-SE');
}

/* ---------------- Documentos (CPF, CNPJ alfanumérico) ---------------- */

/** Só os dígitos. */
export const soDigitos = (valor: string) => valor.replace(/\D/g, '');

/**
 * CNPJ cru, como a API grava: letras em maiúsculas, sem pontuação; os 12 primeiros `[0-9A-Z]`, os 2 últimos só
 * dígitos (o que não serve naquela posição é descartado enquanto se digita). No máximo 14.
 */
export function cnpjCru(valor: string): string {
  let out = '';
  for (const ch of valor.toUpperCase()) {
    if (out.length >= 14) break;
    if (out.length < 12 ? /[0-9A-Z]/.test(ch) : /[0-9]/.test(ch)) out += ch;
  }
  return out;
}

/** Documento cru (CPF ou CNPJ): letras em maiúsculas, sem pontuação. */
export function documentoCru(valor: string): string {
  const alnum = valor.toUpperCase().replace(/[^0-9A-Z]/g, '');
  return /[A-Z]/.test(alnum) || alnum.length > 11 ? cnpjCru(alnum) : alnum.slice(0, 11);
}

/** Junta os pedaços com os separadores, só até onde já há texto (máscara progressiva). */
function pontuar(cru: string, cortes: number[], separadores: string[]): string {
  let out = '';
  let inicio = 0;
  cortes.forEach((fim, i) => {
    const pedaco = cru.slice(inicio, fim);
    if (!pedaco) return;
    out += (i > 0 ? separadores[i - 1] : '') + pedaco;
    inicio = fim;
  });
  return out;
}

/** CPF enquanto se digita: "123.456.789-09". */
export function mascararCpf(valor: string): string {
  return pontuar(soDigitos(valor).slice(0, 11), [3, 6, 9, 11], ['.', '.', '-']);
}

/** CNPJ (alfanumérico) enquanto se digita: "12.ABC.345/01DE-35". */
export function mascararCnpj(valor: string): string {
  return pontuar(cnpjCru(valor), [2, 5, 8, 12, 14], ['.', '.', '/', '-']);
}

/**
 * CPF ou CNPJ, alternando sozinho: até 11 dígitos é CPF; com letra ou a partir do 12º caractere vira CNPJ.
 */
export function mascararCpfCnpj(valor: string): string {
  const cru = documentoCru(valor);
  return /[A-Z]/.test(cru) || cru.length > 11 ? mascararCnpj(cru) : mascararCpf(cru);
}

/** CPF ou CNPJ com pontuação, a partir do valor cru que a API guarda. Outro tamanho volta como veio. */
export function formatarDocumento(documento?: string | null): string {
  if (!documento) return AUSENTE;
  const cru = documento.toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (cru.length === 11 && /^\d+$/.test(cru)) return mascararCpf(cru);
  if (cru.length === 14 && /^[0-9A-Z]{12}\d{2}$/.test(cru)) return mascararCnpj(cru);
  return documento;
}

/* ---------------- CEP, telefone, hora ---------------- */

export function mascararCep(valor: string): string {
  return pontuar(soDigitos(valor).slice(0, 8), [5, 8], ['-']);
}

/** Telefone fixo "(11) 3456-7890" ou celular "(11) 98765-4321". */
export function mascararTelefone(valor: string): string {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  const meio = d.length <= 10 ? 6 : 7;
  return `(${pontuar(d, [2, meio, 11], [') ', '-'])}`;
}

/** "0930" → "09:30". */
export function mascararHora(valor: string): string {
  return pontuar(soDigitos(valor).slice(0, 4), [2, 4], [':']);
}

/** Só dígitos, ou `undefined` — é o que a API espera receber num campo opcional. */
export function somenteDigitos(valor?: string | null): string | undefined {
  if (!valor) return undefined;
  const d = soDigitos(valor);
  return d === '' ? undefined : d;
}

/* ---------------- Números ---------------- */

/** Número em pt-BR para exibição; ausente vira travessão. `maximo` corta casas sem inventar zeros. */
export function formatarNumero(valor?: number | null, maximo = 2, minimo = 0): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return AUSENTE;
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: minimo, maximumFractionDigits: maximo });
}

/** "R$ 1.234,50". Vazio continua o traço: vazio não é R$ 0,00. */
export function formatarMoeda(valor?: number | null): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return AUSENTE;
  return `R$ ${formatarNumero(valor, 2, 2)}`;
}

/** Duração em minutos para exibição: "45 min", "1 h", "1 h 30 min"; ausente (ou zero) vira travessão. */
export function formatarDuracao(minutos?: number | null): string {
  if (minutos === null || minutos === undefined || !Number.isFinite(minutos) || minutos <= 0) return AUSENTE;
  const total = Math.round(minutos);
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

/** `1.234.567` e `1.500` são milhar; `0.750` e `72.5` não são (ver `paraNumero`). */
const PONTO_DE_MILHAR = /^-?(?:\d{1,3}(?:\.\d{3}){2,}|[1-9]\d{0,2}\.\d{3})$/;

/**
 * O que o usuário digitou → número, aceitando vírgula ou ponto como decimal. Vazio → `undefined` (nunca 0).
 *
 * | Digitado | Vira |
 * |---|---|
 * | `1.234,56` | 1234,56 (com vírgula, o ponto é milhar) |
 * | `1.234.567` | 1234567 (mais de um ponto: todos são milhar) |
 * | `1.500` | 1500 (1–3 dígitos, ponto, exatamente 3, sem zero à frente) |
 * | `72.5` · `0.750` | 72,5 · 0,75 (qualquer outro ponto é decimal) |
 */
export function paraNumero(valor?: string | null): number | undefined {
  if (valor === null || valor === undefined) return undefined;
  const cru = valor.trim();
  if (cru === '') return undefined;
  const limpo = cru.includes(',')
    ? cru.replace(/\./g, '').replace(',', '.')
    : PONTO_DE_MILHAR.test(cru)
      ? cru.replace(/\./g, '')
      : cru;
  const n = Number(limpo);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Máscara numérica de centavos (a do EroErp antigo): os dígitos entram pela direita e as casas são fixas;
 * digitar 7 2 5 0 com duas casas dá "72,50". Vazio entra, vazio sai. `casas = 0` é o inteiro ("inteiro").
 */
export function mascararDecimal(valor: string, casas = 2, comSinal = false): string {
  const negativo = comSinal && valor.trimStart().startsWith('-');
  const digitos = soDigitos(valor);
  if (digitos === '') return negativo ? '-' : '';
  const sinal = negativo ? '-' : '';
  if (casas === 0) return sinal + String(Number(digitos.slice(0, 15)));
  const numero = Number(digitos.slice(0, 15)) / 10 ** casas;
  return sinal + numero.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** Texto colado relido como número (colar "70" num campo de duas casas dá "70,00", não "0,70"). */
export function mascararColado(texto: string, casas = 2, comSinal = false): string {
  const n = paraNumero(texto);
  if (n === undefined) return mascararDecimal(texto, casas, comSinal);
  const v = comSinal ? n : Math.abs(n);
  return mascararDecimal((v < 0 ? '-' : '') + Math.abs(v).toFixed(casas).replace('.', ''), casas, comSinal);
}

/** Número da API no formato que a máscara produz (repovoa o campo ao abrir o registro). */
export function textoDaMascara(valor?: number | null, casas = 2): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '';
  return formatarNumero(valor, casas, casas);
}

/** O rótulo de um valor de enum, pela lista de opções do combo; não achou → `undefined` (nunca o valor cru). */
export function rotuloDe<T extends string>(opcoes: readonly { valor: T; rotulo: string }[], valor?: T | null): string | undefined {
  if (!valor) return undefined;
  return opcoes.find((o) => o.valor === valor)?.rotulo;
}
