import { describe, expect, it } from 'vitest';
import type { MeuPerfil } from '../api/conta';
import { paraCorpo, paraForm, schemaDados, schemaSenha, temaParaApi } from './conta';

const perfil = (p: Partial<MeuPerfil> = {}): MeuPerfil => ({
  id: 'u1',
  nome: 'Marina Souza',
  email: 'marina@demo.com.br',
  telefone: null,
  papel: 'ADMIN',
  tenantNome: 'Demo Solar',
  temaPreferido: null,
  version: 4,
  ...p,
});

describe('Meus dados', () => {
  it('lê o perfil e o tema da sessão (null = seguir o contratante)', () => {
    expect(paraForm(perfil({ telefone: '11987654321' }), null)).toEqual({
      nome: 'Marina Souza',
      telefone: '11987654321',
      tema: 'CONTRATANTE',
      email: 'marina@demo.com.br',
      contratante: 'Demo Solar',
      papel: 'Administrador',
    });
    expect(paraForm(perfil({ papel: 'SUPERADMIN', tenantNome: 'Plataforma' }), 'ESCURO')).toMatchObject({
      tema: 'ESCURO',
      contratante: 'Plataforma',
      papel: 'Superadmin',
    });
  });

  it('manda só nome e telefone (dígitos ou null) com a version', () => {
    const d = { ...paraForm(perfil(), null), nome: '  Marina S. ', telefone: '' };
    expect(paraCorpo(d, 4)).toEqual({ nome: 'Marina S.', telefone: null, version: 4 });
    expect(Object.keys(paraCorpo(d, 4))).not.toContain('email');
  });

  it('tema do formulário → API', () => {
    expect(temaParaApi('CONTRATANTE')).toBeNull();
    expect(temaParaApi('CLARO')).toBe('CLARO');
  });

  it('valida nome e telefone', () => {
    const base = paraForm(perfil(), null);
    expect(schemaDados.safeParse(base).success).toBe(true);
    expect(schemaDados.safeParse({ ...base, nome: '  ' }).success).toBe(false);
    expect(schemaDados.safeParse({ ...base, nome: 'x'.repeat(151) }).success).toBe(false);
    expect(schemaDados.safeParse({ ...base, telefone: '123' }).success).toBe(false);
  });
});

describe('Senha', () => {
  it('exige 12 caracteres e a confirmação igual', () => {
    expect(schemaSenha.safeParse({ senhaAtual: 'a', novaSenha: 'x'.repeat(12), confirmar: 'x'.repeat(12) }).success).toBe(true);
    expect(schemaSenha.safeParse({ senhaAtual: 'a', novaSenha: 'curta', confirmar: 'curta' }).success).toBe(false);
    const r = schemaSenha.safeParse({ senhaAtual: 'a', novaSenha: 'x'.repeat(12), confirmar: 'y'.repeat(12) });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(['confirmar']);
  });
});
