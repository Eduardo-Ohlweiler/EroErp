/** Montagem e desmontagem de telas em blocos (DIRECAO-VISUAL, seção 6). Tempos em motion/tokens.ts. */
export { Tela, type TelaProps } from './Tela';
export { Bloco, type BlocoProps } from './Bloco';
export { RotaAnimada, Congelado, useDirecaoPorProfundidade, type RotaAnimadaProps } from './RotaAnimada';
export { TrocaDeArea, type TrocaDeAreaProps } from './TrocaDeArea';
export { TrocaEtapa, type TrocaEtapaProps } from './TrocaEtapa';
export { AtrasoMontagem, BlocoDaTela, useAtrasoMontagem, useBlocoDaTela } from './contexto';
export { aguardarTelaParada, telaEmMovimento } from './andamento';
