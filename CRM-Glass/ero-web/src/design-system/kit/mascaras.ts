import {
  cnpjCru,
  documentoCru,
  mascararCep,
  mascararCnpj,
  mascararColado,
  mascararCpf,
  mascararCpfCnpj,
  mascararDecimal,
  mascararHora,
  mascararTelefone,
  soDigitos,
} from '../../shared/util/format';
import type { Largura } from './larguras';

/**
 * Máscaras do `TEntry` (docs/07 §3.2), funções puras.
 * - Documento, CEP e telefone: exibem pontuado e **gravam cru** (dígitos; o CNPJ alfanumérico grava as letras em
 *   maiúsculas, sem pontuação).
 * - Numéricas: gravam o **texto** da máscara ("72,50"), que o `paraCorpo` da tela converte com `paraNumero`;
 *   vazio continua vazio.
 */
export type MascaraNumerica = 'decimal' | 'inteiro' | 'decimalComSinal' | 'moeda';
export type MascaraDeDocumento = 'cpf' | 'cnpj' | 'cpfCnpj' | 'telefone' | 'celular' | 'cep';
export type Mascara = MascaraNumerica | MascaraDeDocumento | 'hora';

const EXIBIR: Record<MascaraDeDocumento, (v: string) => string> = {
  cpf: mascararCpf,
  cnpj: mascararCnpj,
  cpfCnpj: mascararCpfCnpj,
  telefone: mascararTelefone,
  celular: mascararTelefone,
  cep: mascararCep,
};

const CRU: Record<MascaraDeDocumento, (v: string) => string> = {
  cpf: (v) => soDigitos(v).slice(0, 11),
  cnpj: cnpjCru,
  cpfCnpj: documentoCru,
  telefone: (v) => soDigitos(v).slice(0, 11),
  celular: (v) => soDigitos(v).slice(0, 11),
  cep: (v) => soDigitos(v).slice(0, 8),
};

export const ehNumerica = (m?: Mascara): m is MascaraNumerica =>
  m === 'decimal' || m === 'inteiro' || m === 'decimalComSinal' || m === 'moeda';

export const ehDeDocumento = (m?: Mascara): m is MascaraDeDocumento => !!m && m in EXIBIR;

/** Casas decimais efetivas: `inteiro` é 0; as demais, `casas` ou 2. */
export const casasDa = (m: Mascara | undefined, casas?: number) => (m === 'inteiro' ? 0 : (casas ?? 2));

/** O texto que o campo mostra enquanto se digita (ou cola). */
export function aplicarMascara(mascara: Mascara, texto: string, opcoes: { casas?: number; colou?: boolean } = {}): string {
  if (ehNumerica(mascara)) {
    const casas = casasDa(mascara, opcoes.casas);
    const comSinal = mascara === 'decimalComSinal';
    return opcoes.colou ? mascararColado(texto, casas, comSinal) : mascararDecimal(texto, casas, comSinal);
  }
  if (mascara === 'hora') return mascararHora(texto);
  return EXIBIR[mascara](texto);
}

/** O que vai para o formulário (e para a API): documento cru; numérica e hora, o texto da máscara. */
export function valorParaGravar(mascara: Mascara | undefined, exibido: string): string {
  return ehDeDocumento(mascara) ? CRU[mascara](exibido) : exibido;
}

/** O valor guardado no formulário, como o campo mostra (documento cru → pontuado). */
export function valorParaExibir(mascara: Mascara | undefined, guardado: unknown): string {
  const v = guardado === null || guardado === undefined ? '' : String(guardado);
  return ehDeDocumento(mascara) ? EXIBIR[mascara](v) : v;
}

/** Tamanho máximo do texto exibido. */
export const TAMANHO_MAXIMO: Partial<Record<Mascara, number>> = {
  cpf: 14,
  cnpj: 18,
  cpfCnpj: 18,
  telefone: 15,
  celular: 15,
  cep: 9,
  hora: 5,
};

/** Teclado do celular para a máscara. CNPJ (alfanumérico desde 2026) precisa de letras: teclado de texto. */
export function teclado(mascara?: Mascara): 'numeric' | 'decimal' | 'tel' | undefined {
  if (!mascara) return undefined;
  if (mascara === 'cnpj' || mascara === 'cpfCnpj') return undefined;
  if (mascara === 'telefone' || mascara === 'celular') return 'tel';
  if (mascara === 'inteiro' || mascara === 'cpf' || mascara === 'cep' || mascara === 'hora') return 'numeric';
  return 'decimal';
}

/** Largura padrão do `TEntry` pela máscara (docs/07 §2.3). */
export function larguraPadraoDoEntry(mascara?: Mascara): Largura {
  switch (mascara) {
    case 'cpf':
    case 'telefone':
    case 'celular':
      return 'cpf';
    case 'cnpj':
    case 'cpfCnpj':
      return 'cnpj';
    case 'cep':
      return 'cep';
    case 'hora':
      return 'hora';
    case 'moeda':
    case 'decimal':
    case 'decimalComSinal':
      return 'valor';
    case 'inteiro':
      return 'quantidade';
    default:
      return 'metade';
  }
}
