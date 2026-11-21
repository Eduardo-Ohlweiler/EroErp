import { createContext, useContext } from 'react';

/**
 * A escala de larguras do kit de telas (docs/07 §2). A tela passa um destes nomes em `width` — nunca `"50%"`,
 * `"200px"` nem classe Tailwind solta. A tabela do docs/07 §2.1–§2.2, este mapa e os `LIMITES` do
 * `.claude/skills/olhar-telas/medir-campos.mjs` mudam juntos.
 */
export type Largura =
  | 'uf'
  | 'codigo'
  | 'hora'
  | 'quantidade'
  | 'data'
  | 'cep'
  | 'valor'
  | 'cpf'
  | 'situacao'
  | 'cnpj'
  | 'dataHora'
  | 'curto'
  | 'medio'
  | 'metade'
  | 'longo';

/** Abaixo de `sm` todo campo é 100 %; daqui para cima, o tamanho do dado. Classes por inteiro (o Tailwind lê daqui). */
export const CLASSE_LARGURA: Record<Largura, string> = {
  uf: 'sm:w-20 max-w-full',
  codigo: 'sm:w-32 max-w-full',
  hora: 'sm:w-32 max-w-full',
  quantidade: 'sm:w-32 max-w-full',
  data: 'sm:w-40 max-w-full',
  cep: 'sm:w-40 max-w-full',
  valor: 'sm:w-40 max-w-full',
  cpf: 'sm:w-44 max-w-full',
  situacao: 'sm:w-48 max-w-full',
  cnpj: 'sm:w-52 max-w-full',
  dataHora: 'sm:w-56 max-w-full',
  curto: 'sm:w-56 max-w-full',
  medio: 'sm:w-80 max-w-full',
  metade: 'sm:w-1/2 sm:min-w-64',
  longo: 'sm:w-full sm:min-w-64',
};

/**
 * Larguras abaixo de 160 px, onde o combo não comporta o texto mais o X de limpar e o chevron (80 px − 14 − 72 = nada;
 * 128 px deixa 40 px). Nelas o `TCombo`/`TDBCombo` não tem X: limpa-se escolhendo o `vazio` ou outra opção.
 */
export function larguraEstreita(width: Largura | undefined): boolean {
  return width === 'uf' || width === 'codigo' || width === 'hora' || width === 'quantidade';
}

/** O que o `data-largura` diz: o token aplicado, `celula` (fora de `TRow`, sem `width`) ou `conteudo`. */
export type LarguraAplicada = Largura | 'celula' | 'conteudo';

/** Verdadeiro dentro de uma `TRow` — é onde a largura padrão do campo vale. */
export const DentroDaLinha = createContext(false);

/**
 * Qual largura vale para o campo (função pura): `width` explícito vale sempre; sem ele, o padrão do componente só
 * vale dentro de uma `TRow` — fora dela o campo ocupa a célula (docs/07 §0).
 */
export function larguraAplicada(width: Largura | undefined, padrao: Largura | 'conteudo', dentroDaLinha: boolean): LarguraAplicada {
  if (width) return width;
  return dentroDaLinha ? padrao : 'celula';
}

/** Classe do `div` de fora do campo para a largura aplicada. */
export function classeDaLargura(l: LarguraAplicada): string {
  if (l === 'celula') return 'w-full';
  if (l === 'conteudo') return 'max-w-full';
  return `w-full ${CLASSE_LARGURA[l]}`;
}

/** Largura aplicada e classe, lendo se o campo está numa `TRow`. */
export function useLargura(width: Largura | undefined, padrao: Largura | 'conteudo'): { largura: LarguraAplicada; classe: string } {
  const dentro = useContext(DentroDaLinha);
  const largura = larguraAplicada(width, padrao, dentro);
  return { largura, classe: classeDaLargura(largura) };
}

/** Largura padrão de cada componente do kit (docs/07 §2.3). O `TEntry` com máscara usa `larguraPadraoDoEntry`. */
export const LARGURA_PADRAO = {
  TEntry: 'metade',
  TCombo: 'situacao',
  TDate: 'data',
  TDateTime: 'dataHora',
  TDBCombo: 'metade',
  TDBComboMulti: 'metade',
  TTextArea: 'longo',
  TCheckBox: 'conteudo',
  TRadio: 'conteudo',
  TCor: 'conteudo',
} as const satisfies Record<string, Largura | 'conteudo'>;
