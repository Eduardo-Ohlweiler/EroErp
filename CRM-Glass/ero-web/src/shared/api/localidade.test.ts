import { describe, expect, it } from 'vitest';
import { opcoesDeUf, rotuloDaCidade } from './localidade';

describe('opcoesDeUf', () => {
  it('usa o id como valor e a sigla como rótulo, na ordem da API', () => {
    const lista = [
      { id: 'a', sigla: 'AC', nome: 'Acre' },
      { id: 'b', sigla: 'RS', nome: 'Rio Grande do Sul' },
    ];
    expect(opcoesDeUf(lista)).toEqual([
      { valor: 'a', rotulo: 'AC' },
      { valor: 'b', rotulo: 'RS' },
    ]);
  });

  it('lista vazia, sem opções', () => {
    expect(opcoesDeUf([])).toEqual([]);
  });
});

describe('rotuloDaCidade', () => {
  it('"Nome - UF"', () => {
    expect(rotuloDaCidade({ nome: 'Porto Alegre', uf: 'RS' })).toBe('Porto Alegre - RS');
  });
});
