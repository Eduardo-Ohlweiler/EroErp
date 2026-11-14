import { describe, expect, it } from 'vitest';
import type { UsuarioLogado } from '../api/tipos';
import {
  ESTADO_INICIAL,
  estadoDoUsuario,
  identidadeDoUsuario,
  reduzirSessao,
  trocouIdentidade,
  usuarioDoEstado,
  type EstadoSessao,
} from './estado';

const usuario = (p: Partial<UsuarioLogado> = {}): UsuarioLogado => ({
  id: 'u1',
  nome: 'Ana Ribeiro',
  email: 'ana@demo.com.br',
  papel: 'ADMIN',
  tenantId: 't1',
  tenantNome: 'Demo Solar',
  aparencia: null,
  temaPreferido: null,
  superadminAtuando: false,
  pendencia: 'NENHUMA',
  permissoes: [],
  telas: [],
  ...p,
});

describe('estados da sessão', () => {
  it('começa carregando', () => {
    expect(ESTADO_INICIAL).toEqual({ tipo: 'carregando' });
  });

  it('usuário sem pendência → autenticado; com TROCAR_SENHA → pendente', () => {
    expect(estadoDoUsuario(usuario()).tipo).toBe('autenticado');
    expect(estadoDoUsuario(usuario({ pendencia: 'TROCAR_SENHA' })).tipo).toBe('pendente');
  });

  it('abrir a página sem sessão → anônimo (nenhum)', () => {
    expect(reduzirSessao(ESTADO_INICIAL, { tipo: 'semSessao' })).toEqual({ tipo: 'anonimo', motivo: 'nenhum' });
  });

  it('API fora do ar ao abrir → indisponível, e tentar de novo volta a carregar', () => {
    const e = reduzirSessao(ESTADO_INICIAL, { tipo: 'indisponivel', detail: 'Sem conexão', correlationId: 'abc' });
    expect(e).toEqual({ tipo: 'indisponivel', detail: 'Sem conexão', correlationId: 'abc' });
    expect(reduzirSessao(e, { tipo: 'iniciar' })).toEqual({ tipo: 'carregando' });
  });

  it('troca de senha concluída: pendente → autenticado', () => {
    const pendente = reduzirSessao({ tipo: 'anonimo', motivo: 'nenhum' }, { tipo: 'usuario', usuario: usuario({ pendencia: 'TROCAR_SENHA' }) });
    expect(pendente.tipo).toBe('pendente');
    const ok = reduzirSessao(pendente, { tipo: 'usuario', usuario: usuario() });
    expect(ok.tipo).toBe('autenticado');
  });

  it('sair e expirar levam ao anônimo com o motivo', () => {
    const ok: EstadoSessao = { tipo: 'autenticado', usuario: usuario() };
    expect(reduzirSessao(ok, { tipo: 'encerrada', motivo: 'saiu' })).toEqual({ tipo: 'anonimo', motivo: 'saiu' });
    expect(reduzirSessao(ok, { tipo: 'encerrada', motivo: 'expirou' })).toEqual({ tipo: 'anonimo', motivo: 'expirou' });
  });

  it('quem já está fora não muda de motivo (duas recusas seguidas)', () => {
    const fora: EstadoSessao = { tipo: 'anonimo', motivo: 'saiu' };
    expect(reduzirSessao(fora, { tipo: 'encerrada', motivo: 'expirou' })).toBe(fora);
  });

  it('trocar o tema muda só o temaPreferido do usuário da sessão', () => {
    const antes: EstadoSessao = { tipo: 'autenticado', usuario: usuario() };
    const depois = reduzirSessao(antes, { tipo: 'temaPreferido', tema: 'CLARO' });
    expect(depois).toEqual({ tipo: 'autenticado', usuario: usuario({ temaPreferido: 'CLARO' }) });
    expect(reduzirSessao(depois, { tipo: 'temaPreferido', tema: null })).toEqual(antes);
  });

  it('mesmo tema ou sem sessão: nada muda', () => {
    const com: EstadoSessao = { tipo: 'autenticado', usuario: usuario({ temaPreferido: 'ESCURO' }) };
    expect(reduzirSessao(com, { tipo: 'temaPreferido', tema: 'ESCURO' })).toBe(com);
    const fora: EstadoSessao = { tipo: 'anonimo', motivo: 'saiu' };
    expect(reduzirSessao(fora, { tipo: 'temaPreferido', tema: 'CLARO' })).toBe(fora);
  });

  it('usuarioDoEstado só devolve usuário em pendente/autenticado', () => {
    const u = usuario();
    expect(usuarioDoEstado({ tipo: 'autenticado', usuario: u })).toBe(u);
    expect(usuarioDoEstado({ tipo: 'pendente', usuario: u })).toBe(u);
    expect(usuarioDoEstado({ tipo: 'anonimo', motivo: 'nenhum' })).toBeNull();
    expect(usuarioDoEstado({ tipo: 'carregando' })).toBeNull();
  });
});

describe('troca de identidade (limpa o cache das telas)', () => {
  it('mesmo usuário e contratante não troca', () => {
    expect(trocouIdentidade(identidadeDoUsuario(usuario()), usuario({ nome: 'Outro nome' }))).toBe(false);
  });

  it('outro usuário ou outro contratante troca', () => {
    const antes = identidadeDoUsuario(usuario());
    expect(trocouIdentidade(antes, usuario({ id: 'u2' }))).toBe(true);
    expect(trocouIdentidade(antes, usuario({ tenantId: 't2' }))).toBe(true);
    expect(trocouIdentidade(antes, usuario({ tenantId: null }))).toBe(true);
  });

  it('sem sessão anterior não há o que limpar', () => {
    expect(trocouIdentidade(null, usuario())).toBe(false);
  });
});
