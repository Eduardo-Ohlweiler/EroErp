import { describe, expect, it } from 'vitest';
import type { UsuarioLogado } from '../shared/api/tipos';
import { naVisaoDePlataforma, podeAbrirTela } from '../shared/sessao/rotulos';
import { menuAdministrativo, menuDeCadastros, tituloDaRota } from './menu';

type Perfil = Pick<UsuarioLogado, 'papel' | 'superadminAtuando' | 'telas'>;

/** O que o `GET /api/auth/eu` manda em `telas` (GrupoLiberacao.telasLiberadas): ADMIN e SUPERADMIN recebem tudo. */
const AUXILIARES = [
  'tipo-cadastro-formlist',
  'tipo-telefone-formlist',
  'tipo-email-formlist',
  'tipo-endereco-formlist',
  'tipo-rede-social-formlist',
  'estado-civil-formlist',
  'profissao-formlist',
];
const TODAS = ['usuario-list', 'usuario-form', 'auditoria-list', 'pessoa-list', 'pessoa-form', 'filial-list', 'filial-form', ...AUXILIARES];

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

describe('seção Cadastros do menu', () => {
  const filhos = (p: Perfil) => menuDeCadastros(p).flatMap((i) => i.filhos ?? []).map((f) => f.to);

  it('quem não tem nenhum auxiliar liberado não vê a seção', () => {
    expect(menuDeCadastros(PERFIS.usuarioSemGrupo)).toEqual([]);
    expect(menuDeCadastros(PERFIS.usuarioComAuditoria)).toEqual([]);
  });

  it('ADMIN vê Pessoas, Filiais e depois o pai "Cadastros auxiliares" com os 7 filhos, na ordem do submenu', () => {
    const [pessoas, filiais, pai, ...resto] = menuDeCadastros(PERFIS.admin);
    expect(resto).toEqual([]);
    expect(pessoas.to).toBe('/cadastros/pessoas');
    expect(pessoas.filhos).toBeUndefined();
    expect(filiais.to).toBe('/cadastros/filiais');
    expect(filiais.label).toBe('Filiais');
    expect(filiais.filhos).toBeUndefined();
    expect(pai.to).toBe('/cadastros/auxiliares');
    expect(filhos(PERFIS.admin)).toEqual([
      '/cadastros/auxiliares/tipos-de-cadastro',
      '/cadastros/auxiliares/tipos-de-telefone',
      '/cadastros/auxiliares/tipos-de-email',
      '/cadastros/auxiliares/tipos-de-endereco',
      '/cadastros/auxiliares/tipos-de-rede-social',
      '/cadastros/auxiliares/estados-civis',
      '/cadastros/auxiliares/profissoes',
    ]);
  });

  it('usuário só com Pessoas vê só Pessoas, sem o pai dos auxiliares', () => {
    const so: Perfil = { papel: 'USUARIO', superadminAtuando: false, telas: ['pessoa-list', 'pessoa-form'] };
    expect(menuDeCadastros(so).map((i) => i.to)).toEqual(['/cadastros/pessoas']);
  });

  it('usuário só com Filiais vê só Filiais; Pessoas não abre Filiais', () => {
    const so: Perfil = { papel: 'USUARIO', superadminAtuando: false, telas: ['filial-list', 'filial-form'] };
    expect(menuDeCadastros(so).map((i) => i.to)).toEqual(['/cadastros/filiais']);
    const pessoas: Perfil = { papel: 'USUARIO', superadminAtuando: false, telas: ['pessoa-list', 'pessoa-form'] };
    expect(menuDeCadastros(pessoas).map((i) => i.to)).not.toContain('/cadastros/filiais');
  });

  it('usuário com só um auxiliar liberado vê só o pai, com esse filho', () => {
    const so: Perfil = { papel: 'USUARIO', superadminAtuando: false, telas: ['tipo-telefone-formlist'] };
    expect(menuDeCadastros(so)).toHaveLength(1);
    expect(filhos(so)).toEqual(['/cadastros/auxiliares/tipos-de-telefone']);
  });

  it('superadmin na plataforma não vê a seção; dentro de um contratante, vê', () => {
    expect(menuDeCadastros(PERFIS.superadminNaPlataforma)).toEqual([]);
    expect(filhos(PERFIS.superadminDentro)).toHaveLength(7);
  });
});

describe('título da barra superior', () => {
  it('chama cada tela pelo nome, inclusive as fichas', () => {
    expect(tituloDaRota('/admin/contratantes')).toBe('Contratantes');
    expect(tituloDaRota('/admin/contratantes/novo')).toBe('Contratantes');
    expect(tituloDaRota('/admin/contratantes/abc/aparencia')).toBe('Contratantes');
    expect(tituloDaRota('/admin/usuarios/abc')).toBe('Usuários');
    expect(tituloDaRota('/admin/logs')).toBe('Logs');
    expect(tituloDaRota('/cadastros/pessoas')).toBe('Pessoas');
    expect(tituloDaRota('/cadastros/pessoas/abc')).toBe('Pessoas');
    expect(tituloDaRota('/cadastros/filiais')).toBe('Filiais');
    expect(tituloDaRota('/cadastros/filiais/abc')).toBe('Filiais');
    expect(tituloDaRota('/cadastros/auxiliares/tipos-de-cadastro')).toBe('Tipos de cadastro');
    expect(tituloDaRota('/cadastros/auxiliares/tipos-de-email')).toBe('Tipos de e-mail');
    expect(tituloDaRota('/cadastros/auxiliares/estados-civis')).toBe('Estados civis');
    expect(tituloDaRota('/cadastros/auxiliares/profissoes')).toBe('Profissões');
    expect(tituloDaRota('/minha-conta')).toBe('Minha conta');
    expect(tituloDaRota('/admin/contratantesx')).toBe('Início');
  });
});
