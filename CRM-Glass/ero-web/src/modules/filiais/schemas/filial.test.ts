import { describe, expect, it } from 'vitest';
import type { Filial } from '../api/filiais';
import { paraCorpo, paraForm, schema, VAZIO, type Dados } from './filial';

const ficha = (f: Partial<Filial> = {}): Filial => ({
  id: 'f1',
  codFilial: 2,
  tipo: 'FILIAL',
  pessoa: { id: 'p1', codPessoa: 7, tipoPessoa: 'JURIDICA', nome: 'Solar Sul Ltda.', nomeFantasia: null, documento: '11222333000181', ativo: true },
  matriz: { id: 'm1', codFilial: 1, nome: 'Solar Matriz Ltda.', tipo: 'MATRIZ', cor: '#3B82F6' },
  cor: '#10b981',
  ativo: true,
  createdAt: '2026-11-20T10:00:00Z',
  version: 3,
  ...f,
});

const dados = (d: Partial<Dados> = {}): Dados => ({ pessoaId: 'p1', tipo: 'MATRIZ', matrizId: '', cor: '#3B82F6', ...d });

const erros = (d: Dados) => {
  const r = schema.safeParse(d);
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message]));
};

describe('VAZIO', () => {
  it('abre como Matriz e sem cor', () => {
    expect(VAZIO).toEqual({ pessoaId: '', tipo: 'MATRIZ', matrizId: '', cor: '' });
  });

  it('pede a pessoa e a cor', () => {
    expect(erros(VAZIO)).toEqual({ pessoaId: 'Escolha a pessoa', cor: 'Escolha a cor' });
  });
});

describe('schema', () => {
  it('aceita a matriz sem matriz', () => {
    expect(erros(dados())).toEqual({});
  });

  it('aceita a cor em minúsculas e recusa formato fora de #RRGGBB', () => {
    expect(erros(dados({ cor: '#3b82f6' }))).toEqual({});
    expect(erros(dados({ cor: 'azul' })).cor).toBe('Escolha a cor');
    expect(erros(dados({ cor: '#12345' })).cor).toBe('Escolha a cor');
    expect(erros(dados({ cor: '#1234567' })).cor).toBe('Escolha a cor');
  });

  it('a Filial exige a matriz', () => {
    expect(erros(dados({ tipo: 'FILIAL' })).matrizId).toBe('Informe a matriz');
    expect(erros(dados({ tipo: 'FILIAL', matrizId: 'm1' }))).toEqual({});
  });

  it('a Matriz não pede a matriz', () => {
    expect(erros(dados({ tipo: 'MATRIZ', matrizId: '' })).matrizId).toBeUndefined();
  });
});

describe('paraForm', () => {
  it('leva a pessoa, o tipo, a matriz e a cor da filial gravada', () => {
    expect(paraForm(ficha())).toEqual({ pessoaId: 'p1', tipo: 'FILIAL', matrizId: 'm1', cor: '#10b981' });
  });

  it('a matriz gravada vem sem matriz', () => {
    expect(paraForm(ficha({ tipo: 'MATRIZ', matriz: null })).matrizId).toBe('');
    expect(paraForm(ficha({ tipo: 'MATRIZ', matriz: undefined })).matrizId).toBe('');
  });
});

describe('paraCorpo', () => {
  it('a Filial leva a matriz e a cor em maiúsculas', () => {
    expect(paraCorpo(dados({ tipo: 'FILIAL', matrizId: 'm1', cor: '#10b981' }))).toEqual({
      pessoaId: 'p1',
      tipo: 'FILIAL',
      matrizId: 'm1',
      cor: '#10B981',
    });
  });

  it('a Matriz manda matrizId nulo, mesmo que sobre uma matriz no formulário', () => {
    expect(paraCorpo(dados({ tipo: 'MATRIZ', matrizId: 'm1' })).matrizId).toBeNull();
    expect(paraCorpo(dados({ tipo: 'MATRIZ' })).matrizId).toBeNull();
  });
});
