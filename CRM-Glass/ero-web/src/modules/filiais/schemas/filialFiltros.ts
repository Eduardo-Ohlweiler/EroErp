import type { ColunaExportavel } from '../../../design-system/kit';
import { documentoCru, formatarDocumento, paraNumero } from '../../../shared/util/format';
import { rotuloDaFilial, type Filial, type FiltrosFilialApi, type TipoFilial } from '../api/filiais';

/*
 * Filtros da lista de Filiais e o que a exportação escreve. Validação aqui é conforto: a consulta e as regras são da API.
 * `ativo` fica como texto no formulário (o combo grava texto); `paraConsulta` converte. Sem ordenação: a API recusa `sort`.
 */

export type FiltrosFilial = {
  codFilial: string;
  busca: string;
  documento: string;
  tipo: '' | TipoFilial;
  ativo: '' | 'true' | 'false';
};

/** A situação abre em Ativas (decisão do dono, como Contratantes, Usuários e Pessoas). */
export const FILTROS_VAZIOS: FiltrosFilial = {
  codFilial: '',
  busca: '',
  documento: '',
  tipo: '',
  ativo: 'true',
};

/** Filtros do formulário → parâmetros da API (vazio = todas; o documento vai sem pontuação). */
export function paraConsulta(f: FiltrosFilial): Omit<FiltrosFilialApi, 'page' | 'size'> {
  const codigo = paraNumero(f.codFilial);
  return {
    codFilial: codigo !== undefined && codigo > 0 ? codigo : undefined,
    busca: f.busca.trim() || undefined,
    documento: documentoCru(f.documento) || undefined,
    tipo: f.tipo || undefined,
    ativo: f.ativo === '' ? undefined : f.ativo === 'true',
  };
}

export const rotuloDoTipoFilial = (t: TipoFilial) => (t === 'MATRIZ' ? 'Matriz' : 'Filial');

/** "Solar Ltda · Solar Energia": o nome da pessoa e, se houver, a fantasia (exportação). */
export const nomeComFantasia = (f: Pick<Filial, 'pessoa'>) =>
  f.pessoa.nomeFantasia ? `${f.pessoa.nome} · ${f.pessoa.nomeFantasia}` : f.pessoa.nome;

/** "1 · Solar Matriz", ou vazio na matriz. */
export const matrizDe = (f: Pick<Filial, 'matriz'>) => (f.matriz ? rotuloDaFilial(f.matriz) : '');

/** Exportar e Pdf: a cor não vai (é só identificação visual). */
export const colunasExportadas: ColunaExportavel<Filial>[] = [
  { titulo: 'Código', numerica: true, semQuebra: true, valor: (f) => String(f.codFilial) },
  { titulo: 'Nome', valor: nomeComFantasia },
  { titulo: 'CPF/CNPJ', semQuebra: true, valor: (f) => (f.pessoa.documento ? formatarDocumento(f.pessoa.documento) : '') },
  { titulo: 'Tipo', valor: (f) => rotuloDoTipoFilial(f.tipo) },
  { titulo: 'Matriz', valor: matrizDe },
  { titulo: 'Situação', valor: (f) => (f.ativo ? 'Ativo' : 'Inativo') },
];
