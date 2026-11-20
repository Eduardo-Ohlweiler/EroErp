import { describe, expect, it } from 'vitest';
import type { PessoaResponse } from '../api/pessoas';
import { opcoesDosTiposDeCadastro, paraCorpo, paraForm, schema, VAZIO, type Dados } from './pessoa';

const tipo = (id: string, nome: string, ativo = true) => ({ id, nome, chave: null, ativo });

const ficha = (p: Partial<PessoaResponse> = {}): PessoaResponse => ({
  id: 'p1',
  codPessoa: 7,
  tipoPessoa: 'FISICA',
  nome: 'Marina Souza',
  nomeFantasia: null,
  cpf: '12345678909',
  rg: '1234567',
  dataNascimento: '1990-05-17',
  sexo: 'FEMININO',
  cnpj: null,
  inscricaoEstadual: null,
  inscricaoMunicipal: null,
  observacao: null,
  ativo: true,
  tiposCadastro: [tipo('tc1', 'Cliente')],
  telefones: [{ tipo: tipo('tt1', 'Celular'), numero: '11987654321', observacao: null, principal: true }],
  emails: [{ tipo: tipo('te1', 'Pessoal'), email: 'marina@demo.com.br', observacao: 'Prefere', principal: true }],
  redesSociais: [{ tipo: tipo('tr1', 'Instagram'), usuario: '@marina', url: null }],
  enderecos: [
    {
      tipo: tipo('ten1', 'Residencial'),
      cep: '90610000',
      cidade: { id: 'c1', nome: 'Porto Alegre', uf: 'RS' },
      rua: 'Avenida Ipiranga',
      numero: '1200',
      bairro: 'Partenon',
      complemento: null,
      principal: true,
    },
  ],
  vinculos: [{ pessoa: { id: 'p2', codPessoa: 9, nome: 'Solar Energia Ltda.' }, pessoaAtiva: true, tipo: 'CONTATO', observacao: null }],
  createdAt: '2026-11-16T10:00:00Z',
  version: 3,
  ...p,
});

const valido = (d: Partial<Dados> = {}): Dados => ({ ...VAZIO, nome: 'Marina', tiposCadastroIds: ['tc1'], ...d });

describe('schema da pessoa (conforto; a regra é da API)', () => {
  it('aceita uma pessoa física mínima', () => {
    expect(schema.safeParse(valido()).success).toBe(true);
  });

  it('exige nome e ao menos um tipo de cadastro', () => {
    const r = schema.safeParse(valido({ nome: '  ', tiposCadastroIds: [] }));
    expect(r.success).toBe(false);
    const campos = r.error?.issues.map((i) => i.path[0]);
    expect(campos).toContain('nome');
    expect(campos).toContain('tiposCadastroIds');
  });

  it('só confere o documento do tipo escolhido', () => {
    expect(schema.safeParse(valido({ cpf: '123' })).success).toBe(false);
    expect(schema.safeParse(valido({ tipoPessoa: 'JURIDICA', cpf: '123' })).success).toBe(true);
    expect(schema.safeParse(valido({ tipoPessoa: 'JURIDICA', cnpj: '1122' })).success).toBe(false);
    expect(schema.safeParse(valido({ cnpj: '1122' })).success).toBe(true);
  });

  it('valida as linhas das listas no caminho do DTO', () => {
    const r = schema.safeParse(
      valido({
        telefones: [{ tipoId: '', numero: '123', observacao: '', principal: true }],
        redesSociais: [{ tipoId: 'tr1', usuario: '', url: '' }],
      }),
    );
    expect(r.success).toBe(false);
    const caminhos = r.error?.issues.map((i) => i.path.join('.'));
    expect(caminhos).toContain('telefones.0.tipoId');
    expect(caminhos).toContain('telefones.0.numero');
    expect(caminhos).toContain('redesSociais.0.usuario');
  });

  it('o link da rede social começa com http ou https', () => {
    const rede = (url: string) => valido({ redesSociais: [{ tipoId: 'tr1', usuario: '', url }] });
    expect(schema.safeParse(rede('ftp://x.com')).success).toBe(false);
    expect(schema.safeParse(rede('https://instagram.com/marina')).success).toBe(true);
  });
});

describe('paraForm e paraCorpo', () => {
  it('ida e volta: a ficha lida volta ao corpo igual, sem os rótulos', () => {
    const corpo = paraCorpo(paraForm(ficha()));
    expect(corpo).toEqual({
      tipoPessoa: 'FISICA',
      nome: 'Marina Souza',
      cpf: '12345678909',
      rg: '1234567',
      dataNascimento: '1990-05-17',
      sexo: 'FEMININO',
      cnpj: null,
      nomeFantasia: null,
      inscricaoEstadual: null,
      inscricaoMunicipal: null,
      observacao: null,
      tiposCadastroIds: ['tc1'],
      telefones: [{ tipoId: 'tt1', numero: '11987654321', observacao: null, principal: true }],
      emails: [{ tipoId: 'te1', email: 'marina@demo.com.br', observacao: 'Prefere', principal: true }],
      redesSociais: [{ tipoId: 'tr1', usuario: '@marina', url: null }],
      enderecos: [
        {
          tipoId: 'ten1',
          cep: '90610000',
          cidadeId: 'c1',
          rua: 'Avenida Ipiranga',
          numero: '1200',
          bairro: 'Partenon',
          complemento: null,
          principal: true,
        },
      ],
      vinculos: [{ pessoaId: 'p2', tipo: 'CONTATO', observacao: null }],
    });
  });

  it('o formulário guarda o rótulo da cidade e da pessoa vinculada para os combos', () => {
    const f = paraForm(ficha());
    expect(f.enderecos[0].cidadeRotulo).toBe('Porto Alegre - RS');
    expect(f.vinculos[0].pessoaRotulo).toBe('9 · Solar Energia Ltda.');
  });

  it('manda null nos campos do outro tipo', () => {
    const f = valido({ tipoPessoa: 'JURIDICA', nome: 'Solar Ltda.', cnpj: '11222333000181', nomeFantasia: ' Solar ', cpf: '12345678909', rg: '123456', sexo: 'MASCULINO', dataNascimento: '1990-01-01' });
    const c = paraCorpo(f);
    expect(c).toMatchObject({ cpf: null, rg: null, sexo: null, dataNascimento: null, cnpj: '11222333000181', nomeFantasia: 'Solar' });
    const fis = paraCorpo(valido({ cnpj: '11222333000181', nomeFantasia: 'X', inscricaoEstadual: '12345' }));
    expect(fis).toMatchObject({ cnpj: null, nomeFantasia: null, inscricaoEstadual: null, inscricaoMunicipal: null });
  });

  it('texto vazio vira null; telefone e CEP vão só com dígitos', () => {
    const c = paraCorpo(
      valido({
        observacao: '   ',
        telefones: [{ tipoId: 'tt1', numero: '(11) 98765-4321', observacao: '', principal: true }],
        enderecos: [{ tipoId: 'ten1', principal: true, cep: '90610-000', numero: '', complemento: '', rua: '', bairro: '', cidadeId: 'c1', cidadeRotulo: 'Porto Alegre - RS' }],
      }),
    );
    expect(c.observacao).toBeNull();
    expect(c.telefones[0]).toEqual({ tipoId: 'tt1', numero: '11987654321', observacao: null, principal: true });
    expect(c.enderecos[0]).toMatchObject({ cep: '90610000', rua: null, numero: null, cidadeId: 'c1' });
    expect(c.enderecos[0]).not.toHaveProperty('cidadeRotulo');
  });
});

describe('opcoesDosTiposDeCadastro', () => {
  const ativos = [tipo('tc1', 'Cliente'), tipo('tc2', 'Fornecedor')];

  it('lista só os ativos quando nada gravado está inativo', () => {
    expect(opcoesDosTiposDeCadastro(ativos, [], [])).toEqual([
      { valor: 'tc1', rotulo: 'Cliente' },
      { valor: 'tc2', rotulo: 'Fornecedor' },
    ]);
  });

  it('o inativo gravado aparece com a dica e continua marcável enquanto está marcado', () => {
    const gravados = [tipo('tc9', 'Antigo', false)];
    const marcado = opcoesDosTiposDeCadastro(ativos, gravados, ['tc9']);
    expect(marcado[2]).toEqual({ valor: 'tc9', rotulo: 'Antigo', dica: 'Inativo', desabilitada: false });
  });

  it('o inativo desmarcado fica desabilitado', () => {
    const gravados = [tipo('tc9', 'Antigo', false)];
    expect(opcoesDosTiposDeCadastro(ativos, gravados, [])[2].desabilitada).toBe(true);
  });
});
