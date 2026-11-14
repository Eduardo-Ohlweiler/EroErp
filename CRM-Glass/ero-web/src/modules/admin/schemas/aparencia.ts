import { deApi, paraApi, PADRAO_SISTEMA, type AparenciaApi, type AparenciaApiCompleta } from '../../../shared/aparencia/mapear';
import type { TenantResponse } from '../api/tenants';

/**
 * O que a tela Aparência edita: o AparenciaDto (com `desempenhoAutomatico`, que vai sempre no PUT: ausente, a API
 * grava `false`) e a cena exclusiva ('' = nenhuma).
 */
export type ConfiguracaoContratante = { aparencia: AparenciaApiCompleta; fundoExclusivo: string };

/**
 * A aparência que veio da API, saneada (lista branca e limites do `deApi`), sobre o padrão do sistema: valor
 * desconhecido ou ausente vira o padrão, nunca vai cru para a prévia. `desempenhoAutomatico` ausente vira `false`.
 */
export const configuracaoDe = (t: Pick<TenantResponse, 'aparencia' | 'fundoExclusivo'>): ConfiguracaoContratante => ({
  aparencia: paraApi({ ...PADRAO_SISTEMA, ...deApi(t.aparencia) }),
  fundoExclusivo: t.fundoExclusivo ?? '',
});

/**
 * O que o editor devolve, com `desempenhoAutomatico` sempre preenchido: se o editor não o trouxer, fica o valor
 * que já estava (nunca some do PUT).
 */
export const aparenciaDoEditor = (
  editada: AparenciaApi,
  atual: AparenciaApiCompleta,
): AparenciaApiCompleta => ({ ...editada, desempenhoAutomatico: editada.desempenhoAutomatico ?? atual.desempenhoAutomatico });

const CAMPOS_APARENCIA: readonly (keyof AparenciaApiCompleta)[] = [
  'corDestaque',
  'temaPadrao',
  'fundo',
  'fundoAnimado',
  'vidroDesfoque',
  'fundoFoco',
  'animacoes',
  'desempenhoAutomatico',
];

/** Mudou algo em relação ao que está gravado? (o Voltar pergunta antes de descartar) */
export const configuracaoMudou = (a: ConfiguracaoContratante | null, b: ConfiguracaoContratante | null): boolean =>
  !!a &&
  !!b &&
  (a.fundoExclusivo !== b.fundoExclusivo || CAMPOS_APARENCIA.some((k) => a.aparencia[k] !== b.aparencia[k]));
