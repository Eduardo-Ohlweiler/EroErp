import { describe, expect, it } from 'vitest';
import { NOME_MAXIMO, paraCorpo, paraForm, schema, VAZIO } from './categoriaServico';

describe('schema da categoria de serviço', () => {
  it('pede o nome', () => {
    expect(schema.safeParse(VAZIO).success).toBe(false);
    expect(schema.safeParse({ nome: '   ' }).success).toBe(false);
  });

  it('aceita até 40 caracteres e recusa 41', () => {
    expect(NOME_MAXIMO).toBe(40);
    expect(schema.safeParse({ nome: 'a'.repeat(NOME_MAXIMO) }).success).toBe(true);
    expect(schema.safeParse({ nome: 'a'.repeat(NOME_MAXIMO + 1) }).success).toBe(false);
  });
});

describe('conversões', () => {
  it('paraCorpo corta os espaços das pontas e só manda o nome', () => {
    expect(paraCorpo({ nome: '  Instalação ' })).toEqual({ nome: 'Instalação' });
  });

  it('paraForm devolve o nome do registro', () => {
    expect(paraForm({ nome: 'Manutenção' })).toEqual({ nome: 'Manutenção' });
  });
});
