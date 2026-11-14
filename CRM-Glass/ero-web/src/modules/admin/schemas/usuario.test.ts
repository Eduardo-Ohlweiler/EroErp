import { describe, expect, it } from 'vitest';
import type { GrupoCatalogo, LiberacoesResponse } from '../api/permissoes';
import type { UsuarioResponse } from '../api/usuarios';
import {
  acessoMudou,
  dadosMudaram,
  meuNivel,
  opcoesDeNivel,
  opcoesDePapel,
  paraConsulta,
  paraCorpo,
  paraCorpoCriacao,
  paraForm,
  paraLiberacoes,
  schemaCriacao,
  schemaEdicao,
  situacaoDoUsuario,
  vazio,
} from './usuario';

const CATALOGO: GrupoCatalogo[] = [
  {
    codigo: 'USUARIOS',
    rotulo: 'Usuários',
    telas: [{ codigo: 'usuario-list', rotulo: 'Usuários — lista' }],
    acoes: [{ codigo: 'USUARIOS_LIBERAR_ACESSO', rotulo: 'Liberar acesso de outros usuários' }],
  },
  { codigo: 'AUDITORIA', rotulo: 'Auditoria', telas: [{ codigo: 'auditoria-list', rotulo: 'Logs' }], acoes: [] },
];

const usuario = (p: Partial<UsuarioResponse> = {}): UsuarioResponse => ({
  id: 'u2',
  nome: 'Bruno Carvalho',
  email: 'bruno@demo.com.br',
  telefone: null,
  papel: 'USUARIO',
  ativo: true,
  exigirTrocaSenha: false,
  ultimoLoginEm: null,
  bloqueadoAte: null,
  createdAt: '2026-11-01T12:00:00Z',
  version: 3,
  ...p,
});

const liberacoes = (p: Partial<LiberacoesResponse> = {}): LiberacoesResponse => ({
  usuarioId: 'u2',
  papel: 'USUARIO',
  liberacoes: [{ grupo: 'USUARIOS', nivel: 'LER' }],
  acoes: ['USUARIOS_LIBERAR_ACESSO'],
  version: 3,
  ...p,
});

describe('formulário do usuário', () => {
  it('nasce com papel Usuário e todos os grupos sem acesso', () => {
    expect(vazio(CATALOGO)).toEqual({
      nome: '',
      email: '',
      telefone: '',
      papel: 'USUARIO',
      senha: '',
      niveis: { USUARIOS: 'NENHUM', AUDITORIA: 'NENHUM' },
      acoes: { USUARIOS_LIBERAR_ACESSO: false },
    });
  });

  it('lê usuário e liberações da API', () => {
    const d = paraForm(usuario({ telefone: '11987654321' }), liberacoes(), CATALOGO);
    expect(d.telefone).toBe('11987654321');
    expect(d.niveis).toEqual({ USUARIOS: 'LER', AUDITORIA: 'NENHUM' });
    expect(d.acoes).toEqual({ USUARIOS_LIBERAR_ACESSO: true });
  });

  it('manda telefone só com dígitos e vazio como null', () => {
    const d = { ...vazio(CATALOGO), nome: ' Ana ', email: ' ana@demo.com.br ', telefone: '' };
    expect(paraCorpo(d)).toEqual({ nome: 'Ana', email: 'ana@demo.com.br', telefone: null, papel: 'USUARIO' });
    expect(paraCorpoCriacao({ ...d, telefone: '1134567890', senha: 'x'.repeat(12) })).toMatchObject({
      telefone: '1134567890',
      senha: 'x'.repeat(12),
    });
  });

  it('valida telefone e exige a senha só na criação', () => {
    const base = { ...vazio(CATALOGO), nome: 'Ana', email: 'ana@demo.com.br' };
    expect(schemaEdicao.safeParse(base).success).toBe(true);
    expect(schemaEdicao.safeParse({ ...base, telefone: '123' }).success).toBe(false);
    expect(schemaCriacao.safeParse(base).success).toBe(false);
    expect(schemaCriacao.safeParse({ ...base, senha: 'x'.repeat(12) }).success).toBe(true);
  });

  it('liberações: "Sem acesso" não vai e a ação só vai com o grupo liberado', () => {
    const d = { ...vazio(CATALOGO), niveis: { USUARIOS: 'NENHUM' as const, AUDITORIA: 'LER' as const }, acoes: { USUARIOS_LIBERAR_ACESSO: true } };
    expect(paraLiberacoes(d, CATALOGO)).toEqual({ liberacoes: [{ grupo: 'AUDITORIA', nivel: 'LER' }], acoes: [] });
    const e = { ...d, niveis: { USUARIOS: 'ESCREVER' as const, AUDITORIA: 'NENHUM' as const } };
    expect(paraLiberacoes(e, CATALOGO)).toEqual({
      liberacoes: [{ grupo: 'USUARIOS', nivel: 'ESCREVER' }],
      acoes: ['USUARIOS_LIBERAR_ACESSO'],
    });
  });

  it('sabe se os dados e o acesso mudaram (decide as duas gravações do Salvar)', () => {
    const inicial = paraForm(usuario(), liberacoes(), CATALOGO);
    expect(dadosMudaram({ ...inicial, nome: 'Bruno Carvalho ' }, inicial)).toBe(false);
    expect(dadosMudaram({ ...inicial, telefone: '11987654321' }, inicial)).toBe(true);
    expect(dadosMudaram({ ...inicial, papel: 'ADMIN' }, inicial)).toBe(true);
    expect(acessoMudou(inicial, inicial, CATALOGO)).toBe(false);
    expect(acessoMudou({ ...inicial, niveis: { ...inicial.niveis, AUDITORIA: 'LER' } }, inicial, CATALOGO)).toBe(true);
    // a caixa de uma ação num grupo sem acesso não conta
    const semGrupo = { ...inicial, niveis: { ...inicial.niveis, USUARIOS: 'NENHUM' as const } };
    expect(acessoMudou({ ...semGrupo, acoes: { USUARIOS_LIBERAR_ACESSO: false } }, semGrupo, CATALOGO)).toBe(false);
  });
});

describe('quem libera o quê (conforto da tela)', () => {
  it('lê o meu nível pelas permissões do /eu', () => {
    expect(meuNivel(['USUARIOS_LER', 'USUARIOS_ESCREVER'], 'USUARIOS')).toBe('ESCREVER');
    expect(meuNivel(['AUDITORIA_LER'], 'AUDITORIA')).toBe('LER');
    expect(meuNivel([], 'AUDITORIA')).toBe('NENHUM');
  });

  it('usuário comum não libera acima do nível dele', () => {
    const op = opcoesDeNivel('LER');
    expect(op.map((o) => [o.valor, !!('desabilitada' in o && o.desabilitada)])).toEqual([
      ['NENHUM', false],
      ['LER', false],
      ['ESCREVER', true],
    ]);
    expect(op[2]).toMatchObject({ dica: 'Você só libera o que tem' });
    expect(opcoesDeNivel('TUDO').some((o) => 'desabilitada' in o)).toBe(false);
  });

  it('Administrador só aparece para quem pode dar (ou para mostrar quem já é)', () => {
    expect(opcoesDePapel(true).map((o) => o.valor)).toEqual(['ADMIN', 'USUARIO']);
    expect(opcoesDePapel(false).map((o) => o.valor)).toEqual(['USUARIO']);
    expect(opcoesDePapel(false, 'ADMIN').map((o) => o.valor)).toEqual(['ADMIN', 'USUARIO']);
  });
});

describe('lista de usuários', () => {
  it('situação vira ativo ou bloqueado; vazio é todos', () => {
    expect(paraConsulta({ busca: ' ana ', papel: '', situacao: 'ativos' })).toEqual({ busca: 'ana', ativo: true });
    expect(paraConsulta({ busca: '', papel: 'ADMIN', situacao: 'inativos' })).toEqual({ papel: 'ADMIN', ativo: false });
    expect(paraConsulta({ busca: '', papel: '', situacao: 'bloqueados' })).toEqual({ bloqueado: true });
    expect(paraConsulta({ busca: '', papel: '', situacao: '' })).toEqual({});
  });

  it('situação: bloqueado > inativo > troca de senha pendente > ativo', () => {
    const agora = new Date(2026, 10, 14, 14, 0).getTime();
    const ate = new Date(2026, 10, 14, 14, 35).toISOString();
    expect(situacaoDoUsuario(usuario({ bloqueadoAte: ate, ativo: false }), agora)).toEqual({ tom: 'alerta', texto: 'Bloqueado até 14:35' });
    expect(situacaoDoUsuario(usuario({ ativo: false, exigirTrocaSenha: true }), agora)).toEqual({ tom: 'erro', texto: 'Inativo' });
    expect(situacaoDoUsuario(usuario({ exigirTrocaSenha: true }), agora)).toEqual({ tom: 'info', texto: 'Troca de senha pendente' });
    // bloqueio vencido não conta
    expect(situacaoDoUsuario(usuario({ bloqueadoAte: new Date(2026, 10, 14, 13, 0).toISOString() }), agora)).toEqual({
      tom: 'sucesso',
      texto: 'Ativo',
    });
  });
});
