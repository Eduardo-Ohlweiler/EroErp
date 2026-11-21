import { describe, expect, it } from 'vitest';
import { NOME_MAXIMO, paraCorpo, paraForm, schema, VAZIO } from './tipoCadastro';

describe('schema do tipo de cadastro', () => {
  it('pede o nome', () => {
    expect(schema.safeParse(VAZIO).success).toBe(false);
    expect(schema.safeParse({ nome: '   ' }).success).toBe(false);
  });

  it('aceita até 25 caracteres e recusa 26', () => {
    expect(schema.safeParse({ nome: 'a'.repeat(NOME_MAXIMO) }).success).toBe(true);
    expect(schema.safeParse({ nome: 'a'.repeat(NOME_MAXIMO + 1) }).success).toBe(false);
  });
});

describe('conversões', () => {
  it('paraCorpo corta os espaços das pontas e só manda o nome', () => {
    expect(paraCorpo({ nome: '  Parceiro ' })).toEqual({ nome: 'Parceiro' });
  });

  it('paraForm devolve o nome do registro', () => {
    expect(paraForm({ nome: 'Cliente' })).toEqual({ nome: 'Cliente' });
  });
});
