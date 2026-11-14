import { describe, expect, it } from 'vitest';
import type { UsuarioLogado } from '../shared/api/tipos';
import { naVisaoDePlataforma, podeAbrirTela } from '../shared/sessao/rotulos';
import { menuAdministrativo, tituloDaRota } from './menu';

type Perfil = Pick<UsuarioLogado, 'papel' | 'superadminAtuando' | 'telas'>;

/** O que o `GET /api/auth/eu` manda em `telas` (GrupoLiberacao.telasLiberadas): ADMIN e SUPERADMIN recebem tudo. */
const TODAS = ['usuario-list', 'usuario-form', 'auditoria-list'];

const PERFIS: Record<string, Perfil> = {
  usuarioSemGrupo: { papel: 'USUARIO', superadminAtuando: false, telas: [] },
  usuarioComAuditoria: { papel: 'USUARIO', superadminAtuando: false, telas: ['auditoria-list'] },
  admin: { papel: 'ADMIN', superadminAtuando: false, telas: TODAS },
  superadminNaPlataforma: { papel: 'SUPERADMIN', superadminAtuando: false, telas: TODAS },
  superadminDentro: { papel: 'SUPERADMIN', superadminAtuando: true, telas: TODAS },
};

const rotas = (p: Perfil) => menuAdministrativo(p).map((i) => i.to);

describe('grupo Administrativo do menu, pelos 5 perfis', () => {
  it('USUARIO sem grupo liberado não vê nada no Administrativo', () => {
    expect(rotas(PERFIS.usuarioSemGrupo)).toEqual([]);
  });

  it('USUARIO com AUDITORIA vê só os Logs', () => {
    expect(rotas(PERFIS.usuarioComAuditoria)).toEqual(['/admin/logs']);
  });

  it('ADMIN vê Usuários e Logs, nunca Contratantes', () => {
    expect(rotas(PERFIS.admin)).toEqual(['/admin/usuarios', '/admin/logs']);
  });

  it('superadmin na plataforma vê Logs e Contratantes, sem Usuários', () => {
    expect(rotas(PERFIS.superadminNaPlataforma)).toEqual(['/admin/logs', '/admin/contratantes']);
  });

  it('superadmin dentro de um contratante vê Usuários e Logs, sem Contratantes', () => {
    expect(rotas(PERFIS.superadminDentro)).toEqual(['/admin/usuarios', '/admin/logs']);
  });

  it('o mesmo critério guarda as rotas (ExigeTela e SoPlataforma)', () => {
    expect(podeAbrirTela(PERFIS.superadminNaPlataforma, 'usuario-list', 'contratante')).toBe(false);
    expect(podeAbrirTela(PERFIS.superadminDentro, 'usuario-form', 'contratante')).toBe(true);
    expect(podeAbrirTela(PERFIS.usuarioComAuditoria, 'auditoria-list', 'ambos')).toBe(true);
    expect(podeAbrirTela(PERFIS.usuarioComAuditoria, 'usuario-list', 'contratante')).toBe(false);
    expect(naVisaoDePlataforma({ papel: 'SUPERADMIN', superadminAtuando: false })).toBe(true);
    expect(naVisaoDePlataforma({ papel: 'SUPERADMIN', superadminAtuando: true })).toBe(false);
    expect(naVisaoDePlataforma({ papel: 'ADMIN', superadminAtuando: false })).toBe(false);
  });
});

describe('título da barra superior', () => {
  it('chama cada tela pelo nome, inclusive as fichas', () => {
    expect(tituloDaRota('/admin/contratantes')).toBe('Contratantes');
    expect(tituloDaRota('/admin/contratantes/novo')).toBe('Contratantes');
    expect(tituloDaRota('/admin/contratantes/abc/aparencia')).toBe('Contratantes');
    expect(tituloDaRota('/admin/usuarios/abc')).toBe('Usuários');
    expect(tituloDaRota('/admin/logs')).toBe('Logs');
    expect(tituloDaRota('/minha-conta')).toBe('Minha conta');
    expect(tituloDaRota('/admin/contratantesx')).toBe('Início');
  });
});
