import { describe, expect, it } from 'vitest';
import type { PessoaLista } from '../api/pessoas';
import { consultaDePessoas } from '../api/pessoas';
import { cidadeUf, colunasExportadas, FILTROS_VAZIOS, nomeComFantasia, paraConsulta, tiposDe } from './pessoaFiltros';

const pessoa: PessoaLista = {
  id: 'a1',
  codPessoa: 7,
  tipoPessoa: 'JURIDICA',
  nome: 'Solar Ltda',
  nomeFantasia: 'Solar Energia',
  documento: '12345678000195',
  tiposCadastro: [
    { id: 't1', nome: 'Cliente', chave: 'CLIENTE', ativo: true },
    { id: 't2', nome: 'Fornecedor', chave: 'FORNECEDOR', ativo: true },
  ],
  telefonePrincipal: '51987654321',
  emailPrincipal: 'contato@solar.com.br',
  cidadePrincipal: 'Porto Alegre',
  ufPrincipal: 'RS',
  ativo: true,
};

describe('filtros da lista de Pessoas', () => {
  it('abre em Ativas e sem mais nada', () => {
    expect(FILTROS_VAZIOS.ativo).toBe('true');
    expect(paraConsulta(FILTROS_VAZIOS)).toEqual({
      codPessoa: undefined,
      busca: undefined,
      documento: undefined,
      tipoPessoa: undefined,
      tipoCadastroId: undefined,
      ativo: true,
    });
  });

  it('converte código em número, corta a busca e manda o documento sem pontuação', () => {
    const c = paraConsulta({
      codPessoa: '12',
      busca: '  maria ',
      documento: '123.456.789-09',
      tipoPessoa: 'FISICA',
      tipoCadastroId: 'abc',
      ativo: 'false',
    });
    expect(c).toEqual({
      codPessoa: 12,
      busca: 'maria',
      documento: '12345678909',
      tipoPessoa: 'FISICA',
      tipoCadastroId: 'abc',
      ativo: false,
    });
  });

  it('situação vazia (Todas) não manda `ativo`; código zero não vai', () => {
    const c = paraConsulta({ ...FILTROS_VAZIOS, ativo: '', codPessoa: '0' });
    expect(c.ativo).toBeUndefined();
    expect(c.codPessoa).toBeUndefined();
  });

  it('a query string só leva o que tem valor', () => {
    const q = consultaDePessoas({ ...paraConsulta(FILTROS_VAZIOS), page: 0, size: 20, sort: 'nome,asc' });
    expect(q).toBe('ativo=true&page=0&size=20&sort=nome%2Casc');
  });
});

describe('o que a lista mostra e a exportação escreve', () => {
  it('nome com a fantasia, cidade/UF e tipos por nome', () => {
    expect(nomeComFantasia(pessoa)).toBe('Solar Ltda · Solar Energia');
    expect(nomeComFantasia({ nome: 'Maria', nomeFantasia: null })).toBe('Maria');
    expect(cidadeUf(pessoa)).toBe('Porto Alegre/RS');
    expect(cidadeUf({ cidadePrincipal: null, ufPrincipal: null })).toBe('');
    expect(tiposDe(pessoa)).toBe('Cliente, Fornecedor');
  });

  it('as colunas exportadas não têm nascimento nem RG', () => {
    const titulos = colunasExportadas.map((c) => c.titulo);
    expect(titulos).toEqual(['Código', 'Nome', 'CPF/CNPJ', 'Tipos', 'Telefone', 'E-mail', 'Cidade/UF', 'Situação']);
    const linha = colunasExportadas.map((c) => c.valor(pessoa));
    expect(linha).toEqual([
      '7',
      'Solar Ltda · Solar Energia',
      '12.345.678/0001-95',
      'Cliente, Fornecedor',
      '(51) 98765-4321',
      'contato@solar.com.br',
      'Porto Alegre/RS',
      'Ativo',
    ]);
  });
});
