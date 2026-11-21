import { describe, expect, it } from 'vitest';
import { consultaDeFiliais, filialSchema, rotuloDaFilial, TIPO_FILIAL_OPCOES, type Filial } from '../api/filiais';
import { colunasExportadas, FILTROS_VAZIOS, matrizDe, nomeComFantasia, paraConsulta } from './filialFiltros';

const filial: Filial = {
  id: 'f2',
  codFilial: 2,
  tipo: 'FILIAL',
  pessoa: {
    id: 'p2',
    codPessoa: 7,
    tipoPessoa: 'JURIDICA',
    nome: 'Solar Sul Ltda',
    nomeFantasia: 'Solar Sul',
    documento: '12345678000195',
    ativo: true,
  },
  matriz: { id: 'f1', codFilial: 1, nome: 'Solar Matriz Ltda', tipo: 'MATRIZ', cor: '#3B82F6' },
  cor: '#10B981',
  ativo: true,
  createdAt: '2026-11-20T10:00:00Z',
  version: 0,
};

describe('filtros da lista de Filiais', () => {
  it('abre em Ativas e sem mais nada', () => {
    expect(FILTROS_VAZIOS.ativo).toBe('true');
    expect(paraConsulta(FILTROS_VAZIOS)).toEqual({
      codFilial: undefined,
      busca: undefined,
      documento: undefined,
      tipo: undefined,
      ativo: true,
    });
  });

  it('converte código em número, corta a busca e manda o documento sem pontuação', () => {
    const c = paraConsulta({ codFilial: '12', busca: '  sul ', documento: '12.345.678/0001-95', tipo: 'MATRIZ', ativo: 'false' });
    expect(c).toEqual({ codFilial: 12, busca: 'sul', documento: '12345678000195', tipo: 'MATRIZ', ativo: false });
  });

  it('situação vazia (Todas) não manda `ativo`; código zero não vai', () => {
    const c = paraConsulta({ ...FILTROS_VAZIOS, ativo: '', codFilial: '0' });
    expect(c.ativo).toBeUndefined();
    expect(c.codFilial).toBeUndefined();
  });

  it('a query string só leva o que tem valor e nunca leva `sort`', () => {
    const q = consultaDeFiliais({ ...paraConsulta(FILTROS_VAZIOS), page: 0, size: 20 });
    expect(q).toBe('ativo=true&page=0&size=20');
    expect(q).not.toContain('sort');
    expect(consultaDeFiliais({ ...paraConsulta({ ...FILTROS_VAZIOS, tipo: 'FILIAL', codFilial: '3' }), page: 1, size: 20 })).toBe(
      'codFilial=3&tipo=FILIAL&ativo=true&page=1&size=20',
    );
  });
});

describe('o que a lista mostra e a exportação escreve', () => {
  it('rótulo, nome com fantasia e matriz', () => {
    expect(rotuloDaFilial(filial.matriz!)).toBe('1 · Solar Matriz Ltda');
    expect(nomeComFantasia(filial)).toBe('Solar Sul Ltda · Solar Sul');
    expect(nomeComFantasia({ pessoa: { ...filial.pessoa, nomeFantasia: null } })).toBe('Solar Sul Ltda');
    expect(matrizDe(filial)).toBe('1 · Solar Matriz Ltda');
    expect(matrizDe({ matriz: null })).toBe('');
  });

  it('as colunas exportadas não levam a cor', () => {
    expect(colunasExportadas.map((c) => c.titulo)).toEqual(['Código', 'Nome', 'CPF/CNPJ', 'Tipo', 'Matriz', 'Situação']);
    expect(colunasExportadas.map((c) => c.valor(filial))).toEqual([
      '2',
      'Solar Sul Ltda · Solar Sul',
      '12.345.678/0001-95',
      'Filial',
      '1 · Solar Matriz Ltda',
      'Ativo',
    ]);
  });

  it('o schema aceita a matriz nula e as opções de tipo são Matriz e Filial', () => {
    expect(filialSchema.parse({ ...filial, tipo: 'MATRIZ', matriz: null }).matriz).toBeNull();
    expect(TIPO_FILIAL_OPCOES.map((o) => o.rotulo)).toEqual(['Matriz', 'Filial']);
  });
});
