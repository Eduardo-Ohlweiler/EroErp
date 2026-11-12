import { describe, expect, it } from 'vitest';
import { ehCaminhoInterno, rotaDoLogin, sanitizarVoltar } from './voltar';

describe('sanitizarVoltar', () => {
  it('aceita caminhos internos, com busca e âncora', () => {
    expect(sanitizarVoltar('/')).toBe('/');
    expect(sanitizarVoltar('/usuarios')).toBe('/usuarios');
    expect(sanitizarVoltar('/usuarios/42?aba=acesso#topo')).toBe('/usuarios/42?aba=acesso#topo');
  });

  it('cai no Início quando não há valor', () => {
    expect(sanitizarVoltar(null)).toBe('/');
    expect(sanitizarVoltar(undefined)).toBe('/');
    expect(sanitizarVoltar('')).toBe('/');
    expect(sanitizarVoltar('   ')).toBe('/');
  });

  it.each([
    '//evil.com',
    '//evil.com/usuarios',
    '/\\evil.com',
    '\\\\evil.com',
    '/usuarios\\..\\x',
    'https://evil.com',
    'http:evil.com',
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:text/html,oi',
    'usuarios',
    './usuarios',
    '/usuarios\n//evil.com',
    '/\tevil',
    '/\u0000x',
    // viram "//evil.com" depois que a normalização remove os pontos
    '/.//evil.com',
    '/..//evil.com',
    '/%2e//evil.com',
    '/a/..//evil.com',
    '/%2E%2E//evil.com',
    '/././/evil.com/usuarios',
  ])('recusa %j', (v) => {
    expect(sanitizarVoltar(v)).toBe('/');
  });

  it('não volta para o próprio login', () => {
    expect(sanitizarVoltar('/login')).toBe('/');
    expect(sanitizarVoltar('/login?voltar=/x')).toBe('/');
    expect(sanitizarVoltar('/login/qualquer')).toBe('/');
  });

  it('resolve pontos sem sair da origem', () => {
    expect(sanitizarVoltar('/a/../usuarios')).toBe('/usuarios');
  });

  it('recusa valores enormes', () => {
    expect(sanitizarVoltar(`/${'a'.repeat(3000)}`)).toBe('/');
  });
});

describe('ehCaminhoInterno', () => {
  it('aceita só caminho com uma barra no começo', () => {
    expect(ehCaminhoInterno('/')).toBe(true);
    expect(ehCaminhoInterno('/usuarios?x=1')).toBe(true);
    expect(ehCaminhoInterno('//evil.com')).toBe(false);
    expect(ehCaminhoInterno('/\\evil.com')).toBe(false);
    expect(ehCaminhoInterno('evil.com')).toBe(false);
    expect(ehCaminhoInterno('')).toBe(false);
  });
});

describe('rotaDoLogin', () => {
  it('omite o voltar quando o destino é o Início', () => {
    expect(rotaDoLogin('/')).toBe('/login');
    expect(rotaDoLogin(null)).toBe('/login');
    expect(rotaDoLogin('//evil.com')).toBe('/login');
    expect(rotaDoLogin('/.//evil.com')).toBe('/login');
  });

  it('codifica o destino', () => {
    expect(rotaDoLogin('/usuarios/42?aba=acesso')).toBe('/login?voltar=%2Fusuarios%2F42%3Faba%3Dacesso');
  });
});
