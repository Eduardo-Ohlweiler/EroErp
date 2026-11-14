import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { TipoEvento } from '../api/auditoria';
import { autorDoEvento, categoriasDe, filtrosIniciais, inicioDoDiaIso, paraConsulta, tomDoEvento, usuarioDoEvento } from './logs';

const TIPOS: TipoEvento[] = [
  { codigo: 'LOGIN_SUCESSO', rotulo: 'Login realizado', categoria: 'ACESSOS', categoriaRotulo: 'Acessos', falha: false },
  { codigo: 'LOGIN_FALHA', rotulo: 'Falha no login', categoria: 'FALHAS', categoriaRotulo: 'Falhas e bloqueios', falha: true },
  { codigo: 'CONTA_BLOQUEADA', rotulo: 'Conta bloqueada', categoria: 'FALHAS', categoriaRotulo: 'Falhas e bloqueios', falha: true },
  { codigo: 'TENANT_CRIADO', rotulo: 'Contratante criado', categoria: 'CONTRATANTES', categoriaRotulo: 'Contratantes', falha: false },
  {
    codigo: 'SUPERADMIN_ACESSOU_TENANT',
    rotulo: 'Suporte acessou o contratante',
    categoria: 'SUPORTE',
    categoriaRotulo: 'Suporte da plataforma',
    falha: false,
  },
];

// O período é do calendário de quem usa: os instantes dependem do fuso. Os testes fixam o de Brasília (UTC−3).
let fusoAntes: string | undefined;
beforeEach(() => {
  fusoAntes = process.env.TZ;
  process.env.TZ = 'America/Sao_Paulo';
});
afterEach(() => {
  if (fusoAntes === undefined) delete process.env.TZ;
  else process.env.TZ = fusoAntes;
});

describe('período dos Logs (De · Até → ISO UTC)', () => {
  it('padrão: hoje − 6 até hoje', () => {
    expect(filtrosIniciais('2026-11-14')).toMatchObject({ de: '2026-11-08', ate: '2026-11-14' });
  });

  it('meia-noite local do dia, em UTC', () => {
    expect(inicioDoDiaIso('2026-11-14')).toBe('2026-11-14T03:00:00.000Z');
    expect(inicioDoDiaIso('31/02/2026')).toBeUndefined();
  });

  it('`de` às 00:00 do dia e `ate` às 00:00 do dia seguinte (o dia do Até entra inteiro)', () => {
    const c = paraConsulta(filtrosIniciais('2026-11-14'), TIPOS, false);
    expect(c).toEqual({ de: '2026-11-08T03:00:00.000Z', ate: '2026-11-15T03:00:00.000Z' });
  });

  it('virada de mês e de ano', () => {
    const c = paraConsulta({ ...filtrosIniciais(), de: '2026-12-31', ate: '2026-12-31' }, TIPOS, false);
    expect(c).toMatchObject({ de: '2026-12-31T03:00:00.000Z', ate: '2027-01-01T03:00:00.000Z' });
  });

  it('sem De ou sem Até, a API usa o padrão dela', () => {
    expect(paraConsulta({ ...filtrosIniciais(), de: '', ate: '' }, TIPOS, false)).toEqual({});
  });
});

describe('demais filtros dos Logs', () => {
  it('a categoria vira a lista dos tipos dela', () => {
    const c = paraConsulta({ ...filtrosIniciais('2026-11-14'), categoria: 'FALHAS' }, TIPOS, false);
    expect(c.tipos).toEqual(['LOGIN_FALHA', 'CONTA_BLOQUEADA']);
  });

  it('usuário só dentro do contratante; contratante só na plataforma', () => {
    const f = { ...filtrosIniciais('2026-11-14'), usuarioId: 'u1', tenantId: 't1' };
    expect(paraConsulta(f, TIPOS, false)).toMatchObject({ usuarioId: 'u1' });
    expect(paraConsulta(f, TIPOS, false).tenantId).toBeUndefined();
    expect(paraConsulta(f, TIPOS, true)).toMatchObject({ tenantId: 't1' });
    expect(paraConsulta(f, TIPOS, true).usuarioId).toBeUndefined();
  });

  it('categorias na ordem dos tipos, "Contratantes" só na plataforma', () => {
    expect(categoriasDe(TIPOS, false).map((c) => c.valor)).toEqual(['ACESSOS', 'FALHAS', 'SUPORTE']);
    expect(categoriasDe(TIPOS, true).map((c) => c.rotulo)).toEqual(['Acessos', 'Falhas e bloqueios', 'Contratantes', 'Suporte da plataforma']);
  });
});

describe('colunas dos Logs', () => {
  it('usuário e autor: nome, suporte da plataforma ou ninguém', () => {
    expect(usuarioDoEvento({ usuarioNome: 'Ana', usuarioId: 'u1', suporte: false })).toBe('Ana');
    expect(usuarioDoEvento({ usuarioNome: null, usuarioId: null, suporte: true })).toBe('Suporte da plataforma');
    expect(usuarioDoEvento({ usuarioNome: null, usuarioId: null, suporte: false })).toBe('—');
    expect(autorDoEvento({ autorNome: null, autorId: null, suporte: true })).toBe('Suporte da plataforma');
    expect(autorDoEvento({ autorNome: null, autorId: null, suporte: false })).toBe('Sistema');
  });

  it('tom do evento: falha > suporte > neutro', () => {
    expect(tomDoEvento({ tipo: 'LOGIN_FALHA', suporte: true }, TIPOS[1])).toBe('erro');
    expect(tomDoEvento({ tipo: 'SUPERADMIN_ACESSOU_TENANT', suporte: false }, TIPOS[4])).toBe('info');
    expect(tomDoEvento({ tipo: 'LOGIN_SUCESSO', suporte: false }, TIPOS[0])).toBe('neutro');
    expect(tomDoEvento({ tipo: 'DESCONHECIDO', suporte: false })).toBe('neutro');
  });
});
