import { describe, expect, it } from 'vitest';
import { consultaDeServicos, servicoSchema, type Servico } from '../api/servicos';
import {
  categoriaDe,
  colunasExportadas,
  filiaisEPrecos,
  FILTROS_VAZIOS,
  paraConsulta,
  precoNaFilial,
  quantasFiliais,
  rotuloDaFilialFiltrada,
  textoDoPrecoNaFilial,
} from './servicoFiltros';

const centro = { id: 'f2', codFilial: 2, nome: 'Centro', tipo: 'MATRIZ' as const, cor: '#3B82F6' };
const norte = { id: 'f3', codFilial: 3, nome: 'Norte', tipo: 'FILIAL' as const, cor: '#10B981' };

const servico: Servico = {
  id: 's1',
  codServico: 7,
  nome: 'Instalação',
  categoria: { id: 'c1', nome: 'Obras', chave: null, ativo: true },
  duracaoMinutos: 90,
  descricao: null,
  valores: [
    { filial: centro, valor: 90, filialAtiva: true },
    { filial: norte, valor: null, filialAtiva: true },
  ],
  ativo: true,
  createdAt: '2026-11-21T10:00:00Z',
  version: 0,
};

describe('filtros da lista de Serviços', () => {
  it('abre em Ativos e sem mais nada', () => {
    expect(FILTROS_VAZIOS.ativo).toBe('true');
    expect(paraConsulta(FILTROS_VAZIOS)).toEqual({
      codServico: undefined,
      busca: undefined,
      categoriaId: undefined,
      filialId: undefined,
      ativo: true,
    });
  });

  it('converte código em número, corta a busca e leva categoria e filial', () => {
    const c = paraConsulta({ codServico: '12', busca: '  ar ', categoriaId: 'c1', filialId: 'f2', ativo: 'false' });
    expect(c).toEqual({ codServico: 12, busca: 'ar', categoriaId: 'c1', filialId: 'f2', ativo: false });
  });

  it('situação vazia (Todas) não manda `ativo`; código zero não vai', () => {
    const c = paraConsulta({ ...FILTROS_VAZIOS, ativo: '', codServico: '0' });
    expect(c.ativo).toBeUndefined();
    expect(c.codServico).toBeUndefined();
  });

  it('a query string só leva o que tem valor', () => {
    expect(consultaDeServicos({ ...paraConsulta(FILTROS_VAZIOS), page: 0, size: 20 })).toBe('ativo=true&page=0&size=20');
    expect(consultaDeServicos({ ...paraConsulta({ ...FILTROS_VAZIOS, filialId: 'f2', categoriaId: 'c1' }), page: 1, size: 20 })).toBe(
      'categoriaId=c1&filialId=f2&ativo=true&page=1&size=20',
    );
  });
});

describe('o que a lista mostra', () => {
  it('categoria: traço, nome ou nome (inativo)', () => {
    expect(categoriaDe(servico)).toBe('Obras');
    expect(categoriaDe({ categoria: { id: 'c1', nome: 'Obras', ativo: false } })).toBe('Obras (inativo)');
    expect(categoriaDe({ categoria: null })).toBe('—');
  });

  it('preço na filial: o informado, "Não informado" e a filial que o serviço não tem', () => {
    expect(precoNaFilial(servico, 'f2')).toBe(90);
    expect(precoNaFilial(servico, 'f3')).toBeNull();
    expect(precoNaFilial(servico, 'f9')).toBeUndefined();
    expect(textoDoPrecoNaFilial(servico, 'f2')).toBe('R$ 90,00');
    expect(textoDoPrecoNaFilial(servico, 'f3')).toBe('Não informado');
  });

  it('gratuito não é "Não informado"', () => {
    expect(textoDoPrecoNaFilial({ valores: [{ filial: centro, valor: 0, filialAtiva: true }] }, 'f2')).toBe('R$ 0,00');
  });

  it('quantas filiais e o texto de filiais e preços', () => {
    expect(quantasFiliais(servico)).toBe('2 filiais');
    expect(quantasFiliais({ valores: [servico.valores[0]] })).toBe('1 filial');
    expect(filiaisEPrecos(servico)).toBe('2 · Centro: R$ 90,00; 3 · Norte: não informado');
  });

  it('o rótulo da filial filtrada vem das linhas', () => {
    expect(rotuloDaFilialFiltrada([servico], 'f3')).toBe('3 · Norte');
    expect(rotuloDaFilialFiltrada([], 'f3')).toBe('');
  });
});

describe('exportação', () => {
  it('sem filial: faixa de preços e filiais e preços', () => {
    const colunas = colunasExportadas();
    expect(colunas.map((c) => c.titulo)).toEqual(['Código', 'Nome', 'Categoria', 'Duração', 'Preço', 'Filiais e preços', 'Situação']);
    expect(colunas.map((c) => c.valor(servico))).toEqual([
      '7',
      'Instalação',
      'Obras',
      '1 h 30 min',
      'R$ 90,00',
      '2 · Centro: R$ 90,00; 3 · Norte: não informado',
      'Ativo',
    ]);
  });

  it('com filial: a tabela de preços daquela filial', () => {
    const colunas = colunasExportadas('f3');
    expect(colunas.map((c) => c.titulo)).toEqual(['Código', 'Nome', 'Categoria', 'Duração', 'Preço na filial', 'Situação']);
    expect(colunas[4].valor(servico)).toBe('Não informado');
  });

  it('sem categoria, duração nem preço, as células vão vazias', () => {
    const nu: Servico = { ...servico, categoria: null, duracaoMinutos: null, valores: [{ filial: centro, valor: null, filialAtiva: true }] };
    const v = colunasExportadas().map((c) => c.valor(nu));
    expect(v.slice(2, 5)).toEqual(['', '', '']);
  });
});

describe('schema', () => {
  it('aceita categoria nula e preço nulo', () => {
    const lido = servicoSchema.parse({ ...servico, categoria: null, valores: [{ filial: centro, valor: null, filialAtiva: false }] });
    expect(lido.categoria).toBeNull();
    expect(lido.valores[0].valor).toBeNull();
  });
});
