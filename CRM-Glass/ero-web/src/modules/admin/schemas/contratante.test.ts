import { describe, expect, it } from 'vitest';
import { consultaDe, tenantSchema, type TenantResponse } from '../api/tenants';
import { aparenciaDoEditor, configuracaoDe, configuracaoMudou } from './aparencia';
import {
  FILTROS_VAZIOS,
  paraConsulta,
  paraCorpo,
  paraCorpoCriacao,
  paraForm,
  schemaCriacao,
  schemaEdicao,
  usuariosDe,
  VAZIO,
  type DadosContratante,
} from './contratante';

const tenant: TenantResponse = {
  id: '7b0c',
  nome: 'Teste Solar',
  documento: '12ABC34501DE35',
  email: 'contato@solar.com.br',
  ativo: true,
  limiteUsuarios: 1500,
  usuariosAtivos: 2,
  aparencia: null,
  fundoExclusivo: null,
  createdAt: '2026-11-13T12:00:00Z',
  updatedAt: '2026-11-13T12:00:00Z',
  criadoPorNome: 'Eduardo',
  alteradoPorNome: null,
  version: 3,
};

const dados = (d: Partial<DadosContratante> = {}): DadosContratante => ({
  ...VAZIO,
  nome: 'Teste Solar',
  limiteUsuarios: '5',
  administrador: { nome: 'Ana', email: 'ana@solar.com.br', senha: 'cavalo-bateria-grampo' },
  ...d,
});

describe('formulário do contratante', () => {
  it('abre o registro no formato das máscaras (limite com milhar, nulos vazios)', () => {
    expect(paraForm({ ...tenant, email: null })).toEqual({
      nome: 'Teste Solar',
      documento: '12ABC34501DE35',
      email: '',
      limiteUsuarios: '1.500',
      administrador: undefined,
    });
  });

  it('volta ao corpo da API: texto aparado, vazio vira null, limite vira número', () => {
    expect(paraCorpo(dados({ nome: '  Teste Solar ', documento: '', email: '', limiteUsuarios: '1.500' }))).toEqual({
      nome: 'Teste Solar',
      documento: null,
      email: null,
      limiteUsuarios: 1500,
    });
  });

  it('a criação leva o administrador inicial, com os caminhos do TenantCreateDto', () => {
    const corpo = paraCorpoCriacao(dados({ administrador: { nome: ' Ana ', email: ' ana@solar.com.br ', senha: ' x ' } }));
    expect(corpo.administrador).toEqual({ nome: 'Ana', email: 'ana@solar.com.br', senha: ' x ' });
    expect(corpo).not.toHaveProperty('version');
    expect(corpo).not.toHaveProperty('aparencia');
  });

  it('criação exige o administrador; edição não', () => {
    const semAdmin = dados({ administrador: { nome: '', email: '', senha: '' } });
    const r = schemaCriacao.safeParse(semAdmin);
    expect(r.success).toBe(false);
    const caminhos = r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
    expect(caminhos).toEqual(expect.arrayContaining(['administrador.nome', 'administrador.email', 'administrador.senha']));
    expect(schemaEdicao.safeParse(semAdmin).success).toBe(true);
  });

  it('senha temporária com menos de 12 caracteres é recusada', () => {
    const r = schemaCriacao.safeParse(dados({ administrador: { nome: 'Ana', email: 'ana@solar.com.br', senha: 'curta' } }));
    expect(r.success).toBe(false);
  });

  it('limite de usuários de 1 a 10.000', () => {
    expect(schemaEdicao.safeParse(dados({ limiteUsuarios: '0' })).success).toBe(false);
    expect(schemaEdicao.safeParse(dados({ limiteUsuarios: '10.001' })).success).toBe(false);
    expect(schemaEdicao.safeParse(dados({ limiteUsuarios: '' })).success).toBe(false);
    expect(schemaEdicao.safeParse(dados({ limiteUsuarios: '10.000' })).success).toBe(true);
  });

  it('e-mail é opcional, mas quando vem tem de ser e-mail', () => {
    expect(schemaEdicao.safeParse(dados({ email: '' })).success).toBe(true);
    expect(schemaEdicao.safeParse(dados({ email: 'sem-arroba' })).success).toBe(false);
  });
});

describe('lista de contratantes', () => {
  it('a situação começa em Ativos e vazio quer dizer todas', () => {
    expect(paraConsulta(FILTROS_VAZIOS)).toEqual({ busca: undefined, ativo: true });
    expect(paraConsulta({ busca: '  solar ', ativo: '' })).toEqual({ busca: 'solar', ativo: undefined });
    expect(paraConsulta({ busca: '', ativo: 'false' })).toEqual({ busca: undefined, ativo: false });
  });

  it('a query string só leva o que tem valor', () => {
    expect(consultaDe({ page: 0, size: 20, sort: 'nome,asc' })).toBe('page=0&size=20&sort=nome%2Casc');
    expect(consultaDe({ busca: 'a&b', ativo: false, page: 2, size: 100 })).toBe('busca=a%26b&ativo=false&page=2&size=100');
  });

  it('usuários "2 de 5"; sem limite, só os ativos', () => {
    expect(usuariosDe({ usuariosAtivos: 2, limiteUsuarios: 5 })).toBe('2 de 5');
    expect(usuariosDe({ usuariosAtivos: 3, limiteUsuarios: null })).toBe('3');
  });

  it('o schema aceita o TenantResponseDto da API (com createdBy e campos a mais)', () => {
    const r = tenantSchema.safeParse({ ...tenant, createdBy: 'u1', updatedBy: null, documento: null });
    expect(r.success).toBe(true);
  });
});

describe('aparência do contratante', () => {
  it('sem aparência gravada, vale o padrão do sistema', () => {
    expect(configuracaoDe({ aparencia: null, fundoExclusivo: null })).toEqual({
      aparencia: {
        corDestaque: 'violeta',
        temaPadrao: 'ESCURO',
        fundo: 'ORBS',
        fundoAnimado: true,
        vidroDesfoque: 12,
        fundoFoco: 3,
        animacoes: 'COMPLETAS',
        desempenhoAutomatico: false,
      },
      fundoExclusivo: '',
    });
  });

  it('valor fora da lista branca ou dos limites não passa para a prévia', () => {
    const c = configuracaoDe({
      aparencia: {
        corDestaque: 'url(javascript:1)',
        temaPadrao: 'CLARO',
        fundo: 'MARINA',
        fundoAnimado: false,
        vidroDesfoque: 99,
        fundoFoco: 2.3,
        animacoes: 'REDUZIDAS',
      },
      fundoExclusivo: null,
    });
    expect(c.aparencia).toEqual({
      corDestaque: 'violeta',
      temaPadrao: 'CLARO',
      fundo: 'MARINA',
      fundoAnimado: false,
      vidroDesfoque: 40,
      fundoFoco: 2.5,
      animacoes: 'REDUZIDAS',
      desempenhoAutomatico: false,
    });
  });

  it('percebe a mudança para perguntar antes de descartar', () => {
    const a = configuracaoDe({ aparencia: null, fundoExclusivo: null });
    expect(configuracaoMudou(a, configuracaoDe({ aparencia: null, fundoExclusivo: null }))).toBe(false);
    expect(configuracaoMudou({ ...a, aparencia: { ...a.aparencia, corDestaque: 'rosa' } }, a)).toBe(true);
    expect(configuracaoMudou(null, a)).toBe(false);
  });

  it('otimizar desempenho: gravado passa, ausente vira false, e ligar ou desligar conta como mudança', () => {
    const gravada = { ...APARENCIA_GRAVADA, desempenhoAutomatico: true };
    const ligado = configuracaoDe({ aparencia: gravada, fundoExclusivo: null });
    expect(ligado.aparencia.desempenhoAutomatico).toBe(true);
    expect(configuracaoDe({ aparencia: APARENCIA_GRAVADA, fundoExclusivo: null }).aparencia.desempenhoAutomatico).toBe(false);
    expect(configuracaoDe({ aparencia: { ...APARENCIA_GRAVADA, desempenhoAutomatico: 'sim' as never }, fundoExclusivo: null }).aparencia.desempenhoAutomatico).toBe(false);

    const desligado = { ...ligado, aparencia: { ...ligado.aparencia, desempenhoAutomatico: false } };
    expect(configuracaoMudou(desligado, ligado)).toBe(true);
    expect(configuracaoMudou(ligado, configuracaoDe({ aparencia: gravada, fundoExclusivo: null }))).toBe(false);
    // a ordem das chaves não importa
    const { desempenhoAutomatico, ...resto } = ligado.aparencia;
    expect(configuracaoMudou({ ...ligado, aparencia: { desempenhoAutomatico, ...resto } }, ligado)).toBe(false);
  });

  it('o editor sem o campo não o apaga do PUT', () => {
    const atual = configuracaoDe({ aparencia: { ...APARENCIA_GRAVADA, desempenhoAutomatico: true }, fundoExclusivo: null }).aparencia;
    const { desempenhoAutomatico: _fora, ...semCampo } = atual;
    expect(aparenciaDoEditor(semCampo, atual).desempenhoAutomatico).toBe(true);
    expect(aparenciaDoEditor({ ...semCampo, desempenhoAutomatico: false }, atual).desempenhoAutomatico).toBe(false);
  });

  it('o schema aceita a aparência com e sem desempenhoAutomatico', () => {
    expect(tenantSchema.safeParse({ ...tenant, aparencia: { ...APARENCIA_GRAVADA, desempenhoAutomatico: true } }).success).toBe(true);
    expect(tenantSchema.safeParse({ ...tenant, aparencia: APARENCIA_GRAVADA }).success).toBe(true);
  });
});

const APARENCIA_GRAVADA = {
  corDestaque: 'azul',
  temaPadrao: 'ESCURO',
  fundo: 'AURORA',
  fundoAnimado: true,
  vidroDesfoque: 16,
  fundoFoco: 3,
  animacoes: 'COMPLETAS',
};
