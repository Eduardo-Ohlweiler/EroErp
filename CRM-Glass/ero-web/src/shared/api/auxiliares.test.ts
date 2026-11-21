import { describe, expect, it } from 'vitest';
import { chaveDaSelecao, opcoesDeTipo, tipoAuxiliarSchema, tipoPorChave, type TipoSelect } from './auxiliares';

const LISTA: TipoSelect[] = [
  { id: '1', nome: 'Celular', chave: 'CELULAR', ativo: true },
  { id: '2', nome: 'WhatsApp', chave: 'WHATSAPP', ativo: true },
  { id: '3', nome: 'Recado', chave: null, ativo: true },
];

describe('opcoesDeTipo', () => {
  it('traz os ativos, na ordem da API', () => {
    expect(opcoesDeTipo(LISTA)).toEqual([
      { valor: '1', rotulo: 'Celular' },
      { valor: '2', rotulo: 'WhatsApp' },
      { valor: '3', rotulo: 'Recado' },
    ]);
  });

  it('acrescenta o tipo salvo que foi inativado, com `inativo` e sem o sufixo no texto', () => {
    const salvo = { id: '9', nome: 'Fax', ativo: false };
    expect(opcoesDeTipo(LISTA, [salvo]).at(-1)).toEqual({ valor: '9', rotulo: 'Fax', inativo: true });
  });

  it('não repete o salvo que já está na lista (ativo, ou inativo que a lista traz)', () => {
    expect(opcoesDeTipo(LISTA, [{ id: '1', nome: 'Celular', ativo: true }])).toHaveLength(3);
    const comInativo = [...LISTA, { id: '9', nome: 'Fax', chave: null, ativo: false }];
    // a `/selecao` sem `inativos` não manda o inativo; se vier, o `ativo=false` não entra como opção normal
    expect(opcoesDeTipo(comInativo, [{ id: '9', nome: 'Fax', ativo: false }]).filter((o) => o.valor === '9')).toEqual([
      { valor: '9', rotulo: 'Fax', inativo: true },
    ]);
  });
});

describe('tipoPorChave', () => {
  it('acha o item do sistema ativo', () => {
    expect(tipoPorChave(LISTA, 'CELULAR')?.id).toBe('1');
    expect(tipoPorChave(LISTA, 'CLIENTE')).toBeUndefined();
  });

  it('ignora o inativo', () => {
    expect(tipoPorChave([{ id: '1', nome: 'Celular', chave: 'CELULAR', ativo: false }], 'CELULAR')).toBeUndefined();
  });
});

describe('chaveDaSelecao', () => {
  it('começa pelo recurso, para a invalidação da tela do auxiliar pegar os combos', () => {
    expect(chaveDaSelecao('tipos-telefone')[0]).toBe('tipos-telefone');
    expect(chaveDaSelecao('tipos-telefone', true)).toEqual(['tipos-telefone', 'selecao', true]);
  });
});

describe('tipoAuxiliarSchema', () => {
  const resposta = {
    id: 'a',
    codTipoTelefone: 3,
    nome: 'Celular',
    sistema: true,
    ativo: true,
    createdAt: '2026-11-16T10:00:00Z',
    updatedAt: null,
    createdBy: 'u1',
    updatedBy: null,
    criadoPorNome: 'Ana',
    alteradoPorNome: null,
    version: 0,
  };

  it('entrega o código do recurso em `codigo`', () => {
    const r = tipoAuxiliarSchema('codTipoTelefone').parse(resposta);
    expect(r).toMatchObject({ id: 'a', codigo: 3, nome: 'Celular', sistema: true, ativo: true, version: 0 });
    expect(r).not.toHaveProperty('codTipoTelefone');
  });

  it('recusa a resposta que não traz o código do recurso', () => {
    expect(() => tipoAuxiliarSchema('codTipoEmail').parse(resposta)).toThrow();
  });

  it.each([
    ['estados-civis', 'codEstadoCivil'],
    ['profissoes', 'codProfissao'],
    ['categorias-servico', 'codCategoriaServico'],
  ] as const)('lê o código do recurso %s em `%s`', (_recurso, campo) => {
    const { codTipoTelefone: _descartado, ...base } = resposta;
    const r = tipoAuxiliarSchema(campo).parse({ ...base, [campo]: 7 });
    expect(r.codigo).toBe(7);
    expect(() => tipoAuxiliarSchema(campo).parse(base)).toThrow();
  });
});
