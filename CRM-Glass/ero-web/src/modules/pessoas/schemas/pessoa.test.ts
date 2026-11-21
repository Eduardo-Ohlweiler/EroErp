import { describe, expect, it } from 'vitest';
import { rotuloDaPessoa, SEM_COMPLEMENTOS, type PessoaResponse } from '../api/pessoas';
import {
  CAMPOS_DA_FISICA,
  CAMPOS_DA_JURIDICA,
  CNH_CATEGORIA_OPCOES,
  cnhVencida,
  criarSchema,
  NOVO_VINCULO,
  opcoesDosTiposDeCadastro,
  paraCorpo,
  paraForm,
  problemasDeVinculos,
  schema,
  TIPO_VINCULO_OPCOES,
  VAZIO,
  type Dados,
  type VinculoForm,
} from './pessoa';

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

const fichaCompleta = (): PessoaResponse =>
  ficha({
    rgOrgaoEmissor: 'SSP',
    rgUf: { id: 'uf-rs', sigla: 'RS', nome: 'Rio Grande do Sul' },
    rgDataEmissao: '2010-03-01',
    cnh: '12345678900',
    cnhCategoria: 'AB',
    cnhValidade: '2030-01-31',
    estadoCivil: tipo('ec1', 'Casado'),
    profissao: tipo('pr1', 'Engenheira'),
    nacionalidade: 'Brasileira',
    naturalidade: { id: 'c9', nome: 'Pelotas', uf: 'RS' },
    nomeMae: 'Ana Souza',
    nomePai: 'José Souza',
  });

const valido = (d: Partial<Dados> = {}): Dados => ({ ...VAZIO, nome: 'Marina', tiposCadastroIds: ['tc1'], ...d });

/** Os campos que o schema recusou. */
const camposComErro = (d: Partial<Dados>): string[] => {
  const r = schema.safeParse(valido(d));
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
};
const mensagem = (d: Partial<Dados>, campo: string): string | undefined =>
  schema.safeParse(valido(d)).error?.issues.find((i) => i.path.join('.') === campo)?.message;

describe('regras dos dados complementares (conforto; a API repete)', () => {
  it('CNH: o número vai sozinho, sem categoria nem validade', () => {
    expect(camposComErro({ cnh: '12345678900' })).toEqual([]);
  });

  it('CNH: o número tem 11 dígitos (a pontuação não conta)', () => {
    expect(mensagem({ cnh: '1234567' }, 'cnh')).toBe('CNH deve ter 11 dígitos.');
    expect(camposComErro({ cnh: '123.456.789-00' })).toEqual([]);
  });

  it('CNH: categoria ou validade sem o número são recusadas, no campo da CNH', () => {
    expect(mensagem({ cnhCategoria: 'B' }, 'cnh')).toBe('Informe o número da CNH.');
    expect(mensagem({ cnhValidade: '2030-01-31' }, 'cnh')).toBe('Informe o número da CNH.');
    expect(camposComErro({ cnh: '12345678900', cnhCategoria: 'B', cnhValidade: '2030-01-31' })).toEqual([]);
  });

  it('CNH vencida é aceita e a tela mostra "Vencida"', () => {
    expect(camposComErro({ cnh: '12345678900', cnhValidade: '2020-01-01' })).toEqual([]);
    expect(cnhVencida('2020-01-01', '2026-11-21')).toBe(true);
    expect(cnhVencida('2026-11-21', '2026-11-21')).toBe(false);
    expect(cnhVencida('2030-01-01', '2026-11-21')).toBe(false);
    expect(cnhVencida('')).toBe(false);
  });

  it('validade da CNH: não passa de 15 anos adiante', () => {
    expect(mensagem({ cnh: '12345678900', cnhValidade: '2999-01-01' }, 'cnhValidade')).toBe('Validade da CNH inválida.');
  });

  it('RG: órgão, UF e emissão só com o número do RG (o erro cai no RG)', () => {
    expect(mensagem({ rgOrgaoEmissor: 'SSP' }, 'rg')).toBe('Informe o número do RG.');
    expect(mensagem({ rgEstadoId: 'uf-rs' }, 'rg')).toBe('Informe o número do RG.');
    expect(mensagem({ rgDataEmissao: '2010-03-01' }, 'rg')).toBe('Informe o número do RG.');
    expect(camposComErro({ rg: '123', rgOrgaoEmissor: 'SSP', rgEstadoId: 'uf-rs', rgDataEmissao: '2010-03-01' })).toEqual([]);
    expect(camposComErro({ rg: '123' })).toEqual([]);
  });

  it('RG: órgão emissor só com letras', () => {
    expect(mensagem({ rg: '1', rgOrgaoEmissor: '123' }, 'rgOrgaoEmissor')).toBe('Órgão emissor inválido.');
    expect(camposComErro({ rg: '1', rgOrgaoEmissor: 'SJS/RS' })).toEqual([]);
  });

  it('datas não podem ser futuras', () => {
    expect(mensagem({ rg: '1', rgDataEmissao: '2999-01-01' }, 'rgDataEmissao')).toBe('A emissão não pode ser no futuro.');
    expect(mensagem({ dataNascimento: '2999-01-01' }, 'dataNascimento')).toBe('A data de nascimento não pode ser no futuro.');
    expect(mensagem({ tipoPessoa: 'JURIDICA', dataAbertura: '2999-01-01' }, 'dataAbertura')).toBe('A data de abertura não pode ser no futuro.');
    expect(camposComErro({ tipoPessoa: 'JURIDICA', dataAbertura: '2015-06-10' })).toEqual([]);
  });

  it('a emissão do RG não vem antes do nascimento', () => {
    const d = { rg: '1', dataNascimento: '1990-05-17' };
    expect(mensagem({ ...d, rgDataEmissao: '1990-05-16' }, 'rgDataEmissao')).toBe('A emissão não pode ser anterior ao nascimento.');
    expect(camposComErro({ ...d, rgDataEmissao: '1990-05-17' })).toEqual([]);
    expect(camposComErro({ rg: '1', rgDataEmissao: '1980-01-01' })).toEqual([]); // sem nascimento, não há o que comparar
  });

  it('nacionalidade e filiação têm o limite da API', () => {
    expect(mensagem({ nacionalidade: 'B' }, 'nacionalidade')).toBe('Nacionalidade deve ter de 2 a 40 caracteres.');
    expect(camposComErro({ nacionalidade: 'x'.repeat(41) })).toContain('nacionalidade');
    expect(camposComErro({ nomeMae: 'x'.repeat(256) })).toContain('nomeMae');
    expect(camposComErro({ nacionalidade: 'Brasileira', nomeMae: 'Ana', nomePai: 'José' })).toEqual([]);
  });

  it('na pessoa jurídica só a data de abertura é conferida (os campos de PF ficam vazios)', () => {
    expect(camposComErro({ tipoPessoa: 'JURIDICA', cnhCategoria: 'B' })).toEqual([]);
  });

  it('as opções do formulário: 9 categorias e os dois tipos de vínculo novos', () => {
    expect(CNH_CATEGORIA_OPCOES.map((o) => o.valor)).toEqual(['A', 'B', 'AB', 'C', 'D', 'E', 'AC', 'AD', 'AE']);
    expect(TIPO_VINCULO_OPCOES).toContainEqual({ valor: 'REPRESENTANTE_LEGAL', rotulo: 'Representante legal' });
    expect(TIPO_VINCULO_OPCOES).toContainEqual({ valor: 'REPRESENTADA', rotulo: 'Empresa representada' });
  });

  it('o vínculo de representante legal passa pelo schema e vai ao corpo', () => {
    const v: VinculoForm = { pessoaId: 'a', pessoaRotulo: 'a', pessoaAtiva: true, tipo: 'REPRESENTANTE_LEGAL', observacao: '' };
    expect(schema.safeParse(valido({ tipoPessoa: 'JURIDICA', vinculos: [v] })).success).toBe(true);
    expect(paraCorpo(valido({ vinculos: [v] })).vinculos).toEqual([{ pessoaId: 'a', tipo: 'REPRESENTANTE_LEGAL', observacao: null }]);
  });
});

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
      ...SEM_COMPLEMENTOS,
    });
  });

  it('ida e volta dos dados complementares da pessoa física', () => {
    const f = paraForm(fichaCompleta());
    expect(f).toMatchObject({
      rgOrgaoEmissor: 'SSP',
      rgEstadoId: 'uf-rs',
      rgDataEmissao: '2010-03-01',
      cnh: '12345678900',
      cnhCategoria: 'AB',
      cnhValidade: '2030-01-31',
      estadoCivilId: 'ec1',
      profissaoId: 'pr1',
      nacionalidade: 'Brasileira',
      naturalidadeId: 'c9',
      naturalidadeRotulo: 'Pelotas - RS',
      nomeMae: 'Ana Souza',
      nomePai: 'José Souza',
    });
    expect(paraCorpo(f)).toMatchObject({
      rgOrgaoEmissor: 'SSP',
      rgEstadoId: 'uf-rs',
      rgDataEmissao: '2010-03-01',
      cnh: '12345678900',
      cnhCategoria: 'AB',
      cnhValidade: '2030-01-31',
      estadoCivilId: 'ec1',
      profissaoId: 'pr1',
      nacionalidade: 'Brasileira',
      naturalidadeId: 'c9',
      nomeMae: 'Ana Souza',
      nomePai: 'José Souza',
      dataAbertura: null,
    });
    expect(paraCorpo(f)).not.toHaveProperty('naturalidadeRotulo');
  });

  it('a ficha sem os complementos volta tudo vazio no formulário e null no corpo', () => {
    const f = paraForm(ficha());
    expect(f).toMatchObject({ rgOrgaoEmissor: '', rgEstadoId: '', cnh: '', cnhCategoria: '', estadoCivilId: '', naturalidadeId: '', naturalidadeRotulo: '', dataAbertura: '' });
    expect(paraCorpo(f)).toMatchObject(SEM_COMPLEMENTOS);
  });

  it('pessoa jurídica: leva a data de abertura e manda null em todo campo de pessoa física', () => {
    const f = paraForm(fichaCompleta());
    const pj = paraCorpo({ ...f, tipoPessoa: 'JURIDICA', dataAbertura: '2015-06-10' });
    expect(pj).toMatchObject({ ...SEM_COMPLEMENTOS, dataAbertura: '2015-06-10' });
    expect(paraCorpo({ ...f, dataAbertura: '2015-06-10' }).dataAbertura).toBeNull();
  });

  it('o órgão vai em maiúsculas e a CNH só com dígitos', () => {
    const c = paraCorpo(valido({ rg: '123', rgOrgaoEmissor: ' ssp ', cnh: '123.456.789-00' }));
    expect(c.rgOrgaoEmissor).toBe('SSP');
    expect(c.cnh).toBe('12345678900');
  });

  it('a troca Física/Jurídica limpa os campos novos do bloco que saiu', () => {
    for (const campo of ['rgOrgaoEmissor', 'rgEstadoId', 'rgDataEmissao', 'cnh', 'cnhCategoria', 'cnhValidade', 'estadoCivilId', 'profissaoId', 'nacionalidade', 'naturalidadeId', 'naturalidadeRotulo', 'nomeMae', 'nomePai'] as const) {
      expect(CAMPOS_DA_FISICA).toContain(campo);
    }
    expect(CAMPOS_DA_JURIDICA).toContain('dataAbertura');
    for (const campo of [...CAMPOS_DA_FISICA, ...CAMPOS_DA_JURIDICA]) expect(VAZIO).toHaveProperty(campo);
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

describe('vínculos no formulário', () => {
  const linha = (pessoaId: string, tipo: VinculoForm['tipo'] = 'FAMILIAR'): VinculoForm => ({
    pessoaId,
    pessoaRotulo: pessoaId,
    pessoaAtiva: true,
    tipo,
    observacao: '',
  });

  it('a linha acrescentada nasce vazia e o schema pede a pessoa e o tipo', () => {
    const r = schema.safeParse(valido({ vinculos: [NOVO_VINCULO] }));
    expect(r.success).toBe(false);
    const caminhos = r.error?.issues.map((i) => i.path.join('.'));
    expect(caminhos).toContain('vinculos.0.pessoaId');
    expect(caminhos).toContain('vinculos.0.tipo');
  });

  it('recusa a própria pessoa no caminho da linha', () => {
    const r = criarSchema('eu').safeParse(valido({ vinculos: [linha('outra'), linha('eu')] }));
    expect(r.success).toBe(false);
    const erro = r.error?.issues.find((i) => i.path.join('.') === 'vinculos.1.pessoaId');
    expect(erro?.message).toBe('Uma pessoa não pode ser vinculada a ela mesma.');
  });

  it('sem pessoa aberta (cadastro novo) não há "ela mesma" a recusar', () => {
    expect(problemasDeVinculos([linha('a')])).toEqual([]);
  });

  it('recusa o par repetido, apontando a segunda ocorrência', () => {
    expect(problemasDeVinculos([linha('a'), linha('b'), linha('a', 'CONJUGE')], 'eu')).toEqual([
      { indice: 2, mensagem: 'Esta pessoa já está na lista.' },
    ]);
    const r = schema.safeParse(valido({ vinculos: [linha('a'), linha('a')] }));
    expect(r.error?.issues.map((i) => i.path.join('.'))).toContain('vinculos.1.pessoaId');
  });

  it('linhas sem pessoa não contam como repetidas (o campo obrigatório avisa)', () => {
    expect(problemasDeVinculos([linha(''), linha('')], 'eu')).toEqual([]);
  });

  it('a observação tem o limite da API', () => {
    const longa = { ...linha('a'), observacao: 'x'.repeat(256) };
    expect(schema.safeParse(valido({ vinculos: [longa] })).success).toBe(false);
  });

  it('paraCorpo manda pessoa, tipo e observação (sem rótulo nem situação) e texto vazio vira null', () => {
    const c = paraCorpo(valido({ vinculos: [{ ...linha('a', 'DEPENDENTE'), observacao: ' filho ' }, linha('b', 'CONTATO')] }));
    expect(c.vinculos).toEqual([
      { pessoaId: 'a', tipo: 'DEPENDENTE', observacao: 'filho' },
      { pessoaId: 'b', tipo: 'CONTATO', observacao: null },
    ]);
  });

  it('paraForm guarda se a pessoa vinculada está inativa', () => {
    const f = paraForm(
      ficha({ vinculos: [{ pessoa: { id: 'p3', codPessoa: 4, nome: 'Antiga' }, pessoaAtiva: false, tipo: 'FAMILIAR', observacao: 'tio' }] }),
    );
    expect(f.vinculos[0]).toEqual({ pessoaId: 'p3', pessoaRotulo: '4 · Antiga', pessoaAtiva: false, tipo: 'FAMILIAR', observacao: 'tio' });
  });

  it('o rótulo do combo é "código · nome"', () => {
    expect(rotuloDaPessoa({ codPessoa: 12, nome: 'Marina Souza' })).toBe('12 · Marina Souza');
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
