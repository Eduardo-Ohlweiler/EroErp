import type { ColunaExportavel } from '../../../design-system/kit';
import { AUSENTE, formatarDuracao, formatarMoeda, paraNumero } from '../../../shared/util/format';
import { rotuloDaFilial } from '../../filiais/api/filiais';
import { faixaDePrecos, type FiltrosServicoApi, type Servico } from '../api/servicos';

/*
 * Filtros da lista de Serviços e o que a exportação escreve. Validação aqui é conforto: a consulta e as regras são da API.
 * `ativo` fica como texto no formulário (o combo grava texto); `paraConsulta` converte.
 * Sem filial no filtro a coluna Preço é a faixa das filiais; com filial, é o preço dela ("Preço na filial").
 */

export type FiltrosServico = {
  codServico: string;
  busca: string;
  categoriaId: string;
  filialId: string;
  ativo: '' | 'true' | 'false';
};

/** A situação abre em Ativos (decisão do dono, como Contratantes, Usuários, Pessoas e Filiais). */
export const FILTROS_VAZIOS: FiltrosServico = {
  codServico: '',
  busca: '',
  categoriaId: '',
  filialId: '',
  ativo: 'true',
};

/** Filtros do formulário → parâmetros da API (vazio = todos). */
export function paraConsulta(f: FiltrosServico): Omit<FiltrosServicoApi, 'page' | 'size' | 'sort'> {
  const codigo = paraNumero(f.codServico);
  return {
    codServico: codigo !== undefined && codigo > 0 ? codigo : undefined,
    busca: f.busca.trim() || undefined,
    categoriaId: f.categoriaId || undefined,
    filialId: f.filialId || undefined,
    ativo: f.ativo === '' ? undefined : f.ativo === 'true',
  };
}

/** "Instalação" ou "Instalação (inativo)" quando a categoria foi inativada depois de gravada; "—" sem categoria. */
export const categoriaDe = (s: Pick<Servico, 'categoria'>): string =>
  s.categoria ? (s.categoria.ativo ? s.categoria.nome : `${s.categoria.nome} (inativo)`) : AUSENTE;

/** O preço da filial pedida: `undefined` se o serviço não a tem, `null` se o preço não foi informado. */
export const precoNaFilial = (s: Pick<Servico, 'valores'>, filialId: string): number | null | undefined =>
  s.valores.find((v) => v.filial.id === filialId)?.valor;

/** "R$ 90,00" ou "Não informado" (o preço da filial filtrada). */
export const textoDoPrecoNaFilial = (s: Pick<Servico, 'valores'>, filialId: string): string => {
  const preco = precoNaFilial(s, filialId);
  return preco === null || preco === undefined ? 'Não informado' : formatarMoeda(preco);
};

/** "1 filial" · "3 filiais" · "3 filiais · 1 sem preço" (a filial sem preço informado não some atrás da faixa). */
export const quantasFiliais = (s: Pick<Servico, 'valores'>): string => {
  const total = s.valores.length;
  const semPreco = s.valores.filter((v) => v.valor === null || v.valor === undefined).length;
  const filiais = total === 1 ? '1 filial' : `${total} filiais`;
  return semPreco === 0 ? filiais : `${filiais} · ${semPreco} sem preço`;
};

/** "2 · Centro: R$ 90,00; 3 · Norte: não informado" (exportação). */
export const filiaisEPrecos = (s: Pick<Servico, 'valores'>): string =>
  s.valores
    .map((v) => `${rotuloDaFilial(v.filial)}: ${v.valor === null ? 'não informado' : formatarMoeda(v.valor)}`)
    .join('; ');

/** O rótulo da filial do filtro, achado nas próprias linhas (todas as linhas trazem a filial filtrada). */
export const rotuloDaFilialFiltrada = (linhas: readonly Pick<Servico, 'valores'>[], filialId: string): string => {
  for (const s of linhas) {
    const achada = s.valores.find((v) => v.filial.id === filialId);
    if (achada) return rotuloDaFilial(achada.filial);
  }
  return '';
};

/**
 * Exportar e Pdf. Sem filial: Preço (faixa) e "Filiais e preços" em texto. Com filial: só "Preço na filial", e o Pdf vira
 * a tabela de preços daquela filial.
 */
export function colunasExportadas(filialId?: string): ColunaExportavel<Servico>[] {
  const base: ColunaExportavel<Servico>[] = [
    { titulo: 'Código', numerica: true, semQuebra: true, valor: (s) => String(s.codServico) },
    { titulo: 'Nome', valor: (s) => s.nome },
    { titulo: 'Categoria', valor: (s) => (s.categoria ? categoriaDe(s) : '') },
    { titulo: 'Duração', numerica: true, semQuebra: true, valor: (s) => (s.duracaoMinutos ? formatarDuracao(s.duracaoMinutos) : '') },
  ];
  const situacao: ColunaExportavel<Servico> = { titulo: 'Situação', semQuebra: true, valor: (s) => (s.ativo ? 'Ativo' : 'Inativo') };
  if (filialId) {
    return [
      ...base,
      { titulo: 'Preço na filial', numerica: true, semQuebra: true, valor: (s) => textoDoPrecoNaFilial(s, filialId) },
      situacao,
    ];
  }
  return [
    ...base,
    { titulo: 'Preço', numerica: true, semQuebra: true, valor: (s) => (faixaDePrecos(s.valores) === AUSENTE ? '' : faixaDePrecos(s.valores)) },
    { titulo: 'Filiais e preços', valor: filiaisEPrecos },
    situacao,
  ];
}
