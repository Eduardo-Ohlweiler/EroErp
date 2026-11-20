import { describe, expect, it } from 'vitest';
import type { TipoSelect } from '../../../shared/api/auxiliares';
import { paraCorpoRapido, schemaRapido, vazioRapido, type DadosRapidos } from './pessoaRapida';

const tipo = (id: string, nome: string, chave: string | null = null, ativo = true): TipoSelect => ({ id, nome, chave, ativo });
const tipos = [tipo('tc1', 'Cliente', 'CLIENTE'), tipo('tc2', 'Fornecedor', 'FORNECEDOR')];

const preenchido = (d: Partial<DadosRapidos> = {}): DadosRapidos => ({ ...vazioRapido(tipos), nome: 'Marina', ...d });

describe('vazioRapido', () => {
  it('nasce física, com o item do sistema "Cliente" marcado e uma linha de telefone em branco', () => {
    expect(vazioRapido(tipos)).toMatchObject({ tipoPessoa: 'FISICA', tiposCadastroIds: ['tc1'], telefones: [{ numero: '' }] });
  });

  it('acha o Cliente pela chave, não pelo nome (o contratante pode ter um próprio chamado "Cliente")', () => {
    const lista = [tipo('x', 'Cliente'), tipo('tc1', 'Cliente', 'CLIENTE')];
    expect(vazioRapido(lista).tiposCadastroIds).toEqual(['tc1']);
  });

  it('sem Cliente ativo, nada vem marcado', () => {
    expect(vazioRapido([tipo('tc1', 'Cliente', 'CLIENTE', false)]).tiposCadastroIds).toEqual([]);
  });
});

describe('schemaRapido (conforto; a regra é da API)', () => {
  it('aceita o mínimo: nome e um tipo de cadastro', () => {
    expect(schemaRapido.safeParse(preenchido()).success).toBe(true);
  });

  it('exige nome e ao menos um tipo de cadastro', () => {
    const r = schemaRapido.safeParse(preenchido({ nome: ' ', tiposCadastroIds: [] }));
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(expect.arrayContaining(['nome', 'tiposCadastroIds']));
  });

  it('o telefone é opcional, mas quando vem tem 10 ou 11 dígitos, no caminho do DTO', () => {
    expect(schemaRapido.safeParse(preenchido({ telefones: [{ numero: '(11) 98765-4321' }] })).success).toBe(true);
    const r = schemaRapido.safeParse(preenchido({ telefones: [{ numero: '1234' }] }));
    expect(r.error?.issues.map((i) => i.path.join('.'))).toContain('telefones.0.numero');
  });

  it('só confere o documento do tipo escolhido', () => {
    expect(schemaRapido.safeParse(preenchido({ cpf: '123' })).success).toBe(false);
    expect(schemaRapido.safeParse(preenchido({ tipoPessoa: 'JURIDICA', cpf: '123' })).success).toBe(true);
    expect(schemaRapido.safeParse(preenchido({ tipoPessoa: 'JURIDICA', cnpj: '12' })).success).toBe(false);
  });
});

describe('paraCorpoRapido', () => {
  it('pessoa física mínima: só nome, tipo de cadastro e nenhuma lista', () => {
    expect(paraCorpoRapido(preenchido(), 'cel')).toEqual({
      tipoPessoa: 'FISICA',
      nome: 'Marina',
      cpf: null,
      rg: null,
      dataNascimento: null,
      sexo: null,
      cnpj: null,
      nomeFantasia: null,
      inscricaoEstadual: null,
      inscricaoMunicipal: null,
      observacao: null,
      tiposCadastroIds: ['tc1'],
      telefones: [],
      emails: [],
      redesSociais: [],
      enderecos: [],
      vinculos: [],
    });
  });

  it('o telefone vai como celular principal, só com dígitos', () => {
    const c = paraCorpoRapido(preenchido({ telefones: [{ numero: '(11) 98765-4321' }] }), 'cel');
    expect(c.telefones).toEqual([{ tipoId: 'cel', numero: '11987654321', observacao: null, principal: true }]);
  });

  it('sem o tipo Celular a pessoa vai sem telefone (a tela avisa antes)', () => {
    expect(paraCorpoRapido(preenchido({ telefones: [{ numero: '11987654321' }] }), undefined).telefones).toEqual([]);
  });

  it('manda null nos campos do outro tipo e o documento sem pontuação', () => {
    const pj = paraCorpoRapido(preenchido({ tipoPessoa: 'JURIDICA', cnpj: '11.222.333/0001-81', cpf: '123', sexo: 'MASCULINO', dataNascimento: '1990-01-01' }), 'cel');
    expect(pj).toMatchObject({ cnpj: '11222333000181', cpf: null, sexo: null, dataNascimento: null });
    const pf = paraCorpoRapido(preenchido({ cpf: '123.456.789-09', sexo: 'FEMININO', dataNascimento: '1990-05-17', cnpj: '11222333000181' }), 'cel');
    expect(pf).toMatchObject({ cpf: '12345678909', sexo: 'FEMININO', dataNascimento: '1990-05-17', cnpj: null });
  });
});
