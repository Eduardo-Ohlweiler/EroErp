import { describe, expect, it } from 'vitest';
import type { Servico } from '../api/servicos';
import { filiaisQueFaltam, LIMITE_SELECAO_FILIAIS, paraCorpo, paraForm, schema, VAZIO, type Dados, type LinhaDeValor } from './servico';

const filial = (id: string, cod: number, nome: string, cor = '#3B82F6') => ({ id, codFilial: cod, nome, tipo: 'MATRIZ' as const, cor });

const ficha = (s: Partial<Servico> = {}): Servico => ({
  id: 's1',
  codServico: 4,
  nome: 'Instalação',
  categoria: { id: 'c1', nome: 'Obras', chave: null, ativo: true },
  duracaoMinutos: 90,
  descricao: 'Instala o equipamento.',
  valores: [
    { filial: filial('f1', 1, 'Matriz Centro'), valor: 90, filialAtiva: true },
    { filial: filial('f2', 2, 'Zona Norte', '#10B981'), valor: null, filialAtiva: false },
    { filial: filial('f3', 3, 'Zona Sul'), valor: 0, filialAtiva: true },
  ],
  ativo: true,
  createdAt: '2026-11-20T10:00:00Z',
  version: 2,
  ...s,
});

const linha = (l: Partial<LinhaDeValor> = {}): LinhaDeValor => ({
  filialId: 'f1',
  filialRotulo: '1 · Matriz Centro',
  filialCor: '#3B82F6',
  filialAtiva: true,
  preco: '',
  ...l,
});

const dados = (d: Partial<Dados> = {}): Dados => ({ nome: 'Instalação', categoriaId: '', duracao: '', descricao: '', valores: [linha()], ...d });

const erros = (d: Dados) => {
  const r = schema.safeParse(d);
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message]));
};

describe('VAZIO', () => {
  it('abre sem filial e pede o nome e a filial', () => {
    expect(VAZIO).toEqual({ nome: '', categoriaId: '', duracao: '', descricao: '', valores: [] });
    expect(erros(VAZIO)).toEqual({
      nome: 'Informe o nome.',
      valores: 'Informe pelo menos uma filial onde o serviço é prestado.',
    });
  });
});

describe('schema', () => {
  it('só o nome e uma filial são obrigatórios (categoria, duração, descrição e preço são opcionais)', () => {
    expect(erros(dados())).toEqual({});
  });

  it('recusa nome em branco e nome acima de 150', () => {
    expect(erros(dados({ nome: '   ' })).nome).toBe('Informe o nome.');
    expect(erros(dados({ nome: 'a'.repeat(151) })).nome).toBe('No máximo 150 caracteres.');
    expect(erros(dados({ nome: 'a'.repeat(150) }))).toEqual({});
  });

  it('a duração vazia vale; informada, de 1 a 1.440', () => {
    expect(erros(dados({ duracao: '' }))).toEqual({});
    expect(erros(dados({ duracao: '1' }))).toEqual({});
    expect(erros(dados({ duracao: '1440' }))).toEqual({});
    expect(erros(dados({ duracao: '0' })).duracao).toBe('Informe de 1 a 1.440 minutos.');
    expect(erros(dados({ duracao: '1441' })).duracao).toBe('Informe de 1 a 1.440 minutos.');
  });

  it('limita a descrição a 2.000 caracteres', () => {
    expect(erros(dados({ descricao: 'a'.repeat(2000) }))).toEqual({});
    expect(erros(dados({ descricao: 'a'.repeat(2001) })).descricao).toBe('No máximo 2000 caracteres.');
  });

  it('pede a filial de cada linha', () => {
    expect(erros(dados({ valores: [linha({ filialId: '' })] }))['valores.0.filialId']).toBe('Escolha a filial.');
  });

  it('marca a 2ª ocorrência da filial repetida', () => {
    const e = erros(dados({ valores: [linha(), linha({ filialId: 'f2' }), linha()] }));
    expect(e['valores.2.filialId']).toBe('Esta filial já está na lista.');
    expect(e['valores.0.filialId']).toBeUndefined();
    expect(e['valores.1.filialId']).toBeUndefined();
  });
});

describe('paraForm', () => {
  it('leva os campos, a filial com rótulo, cor e situação, e o preço no formato da máscara', () => {
    const f = paraForm(ficha());
    expect(f.nome).toBe('Instalação');
    expect(f.categoriaId).toBe('c1');
    expect(f.duracao).toBe('90');
    expect(f.descricao).toBe('Instala o equipamento.');
    expect(f.valores).toEqual([
      { filialId: 'f1', filialRotulo: '1 · Matriz Centro', filialCor: '#3B82F6', filialAtiva: true, preco: '90,00' },
      { filialId: 'f2', filialRotulo: '2 · Zona Norte', filialCor: '#10B981', filialAtiva: false, preco: '' },
      { filialId: 'f3', filialRotulo: '3 · Zona Sul', filialCor: '#3B82F6', filialAtiva: true, preco: '0,00' },
    ]);
  });

  it('sem categoria, duração nem descrição vira campo vazio', () => {
    const f = paraForm(ficha({ categoria: null, duracaoMinutos: null, descricao: null }));
    expect(f).toMatchObject({ categoriaId: '', duracao: '', descricao: '' });
    expect(paraForm(ficha({ categoria: undefined, duracaoMinutos: undefined, descricao: undefined }))).toMatchObject({
      categoriaId: '',
      duracao: '',
      descricao: '',
    });
  });
});

describe('paraCorpo', () => {
  it('preço vazio vai nulo, e zero vai 0 (gratuito)', () => {
    const c = paraCorpo(dados({ valores: [linha({ preco: '' }), linha({ filialId: 'f2', preco: '0,00' }), linha({ filialId: 'f3', preco: '1.234,50' })] }));
    expect(c.valores).toEqual([
      { filialId: 'f1', valor: null },
      { filialId: 'f2', valor: 0 },
      { filialId: 'f3', valor: 1234.5 },
    ]);
  });

  it('vazio vira nulo: categoria, duração e descrição em branco', () => {
    expect(paraCorpo(dados({ categoriaId: '', duracao: '', descricao: '   ' }))).toEqual({
      nome: 'Instalação',
      categoriaId: null,
      duracaoMinutos: null,
      descricao: null,
      valores: [{ filialId: 'f1', valor: null }],
    });
  });

  it('leva categoria, duração e descrição sem as pontas em branco, e só a filial e o preço de cada linha', () => {
    expect(paraCorpo(dados({ nome: ' Instalação ', categoriaId: 'c1', duracao: '90', descricao: ' Instala. ' }))).toEqual({
      nome: 'Instalação',
      categoriaId: 'c1',
      duracaoMinutos: 90,
      descricao: 'Instala.',
      valores: [{ filialId: 'f1', valor: null }],
    });
  });

  it('manda sempre a lista de valores (o estado completo)', () => {
    expect(paraCorpo(dados({ valores: [] })).valores).toEqual([]);
  });

  it('ida e volta: o que a API devolveu sai igual, com o preço zero e o não informado preservados', () => {
    const corpo = paraCorpo(paraForm(ficha()));
    expect(corpo.valores).toEqual([
      { filialId: 'f1', valor: 90 },
      { filialId: 'f2', valor: null },
      { filialId: 'f3', valor: 0 },
    ]);
  });
});

describe('filiaisQueFaltam (Todas as filiais)', () => {
  const lote = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `f${i + 1}` }));

  it('acrescenta só as que ainda não estão na lista', () => {
    expect(filiaisQueFaltam(lote(3), ['f2'])).toEqual({ faltam: [{ id: 'f1' }, { id: 'f3' }], cortou: false });
    expect(filiaisQueFaltam(lote(2), ['f1', 'f2'])).toEqual({ faltam: [], cortou: false });
  });

  it('resposta no limite da API é resposta cortada: pode haver mais filiais', () => {
    expect(LIMITE_SELECAO_FILIAIS).toBe(20);
    expect(filiaisQueFaltam(lote(19), []).cortou).toBe(false);
    expect(filiaisQueFaltam(lote(20), []).cortou).toBe(true);
    expect(filiaisQueFaltam(lote(20), lote(20).map((f) => f.id))).toEqual({ faltam: [], cortou: true });
  });
});
