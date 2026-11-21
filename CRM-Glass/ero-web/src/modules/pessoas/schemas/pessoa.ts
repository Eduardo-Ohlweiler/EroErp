import { z } from 'zod';
import type { OpcaoCheckBox, OpcaoCombo, OpcaoRadio } from '../../../design-system/kit';
import { documentoCru, soDigitos } from '../../../shared/util/format';
import { rotuloDaCidade } from '../../../shared/api/localidade';
import { rotuloDaPessoa, type PessoaCreate, type PessoaResponse } from '../api/pessoas';

/*
 * Formulário da pessoa: espelha o PessoaCreateDto / PessoaUpdateDto da ero-api, com os mesmos caminhos de campo
 * (`telefones.0.numero`, `tiposCadastroIds`), para o 400 e o 409 da API caírem no campo certo. Validação aqui é
 * conforto: a regra (documento válido e único, tipo inativo, vínculo, principal único...) é da API.
 *
 * O formulário guarda os dois blocos (física e jurídica); o `paraCorpo` manda `null` nos campos do outro tipo.
 * `cidadeRotulo` e `pessoaRotulo` só alimentam o `TDBCombo` (o nome do que já está escolhido) e não vão para a API.
 * `vinculos` é o estado completo e volta no PUT: a API substitui a lista (o que sai da tela é apagado). `tipo` é o que a
 * OUTRA pessoa é desta; a orientação e o inverso a API resolve. `pessoaAtiva` só alimenta o aviso "Inativa".
 */

/** Física e Jurídica: o mesmo enum do filtro da lista. */
export { TIPO_PESSOA_OPCOES } from './pessoaFiltros';

export const SEXO_OPCOES: OpcaoRadio[] = [
  { valor: 'MASCULINO', rotulo: 'Masculino' },
  { valor: 'FEMININO', rotulo: 'Feminino' },
];

const TIPOS_VINCULO = ['RESPONSAVEL', 'DEPENDENTE', 'CONJUGE', 'FAMILIAR', 'CONTATO', 'EMPRESA'] as const;

/** "É o quê desta pessoa": o que a OUTRA pessoa é desta (o inverso a API resolve). */
export const TIPO_VINCULO_OPCOES: OpcaoCombo[] = [
  { valor: 'RESPONSAVEL', rotulo: 'Responsável' },
  { valor: 'DEPENDENTE', rotulo: 'Dependente' },
  { valor: 'CONJUGE', rotulo: 'Cônjuge' },
  { valor: 'FAMILIAR', rotulo: 'Familiar' },
  { valor: 'CONTATO', rotulo: 'Contato' },
  { valor: 'EMPRESA', rotulo: 'Empresa' },
];

const telefone = z.object({
  tipoId: z.string().min(1, 'Escolha o tipo.'),
  numero: z.string().refine((v) => /^\d{10,11}$/.test(soDigitos(v)), 'Telefone deve ter 10 ou 11 dígitos.'),
  observacao: z.string().max(255, 'No máximo 255 caracteres.'),
  principal: z.boolean(),
});

const email = z.object({
  tipoId: z.string().min(1, 'Escolha o tipo.'),
  email: z.string().trim().min(1, 'Informe o e-mail.').pipe(z.email('E-mail inválido.').max(255, 'No máximo 255 caracteres.')),
  observacao: z.string().max(255, 'No máximo 255 caracteres.'),
  principal: z.boolean(),
});

const redeSocial = z
  .object({
    tipoId: z.string().min(1, 'Escolha a rede.'),
    usuario: z.string().max(255, 'No máximo 255 caracteres.'),
    url: z
      .string()
      .max(500, 'No máximo 500 caracteres.')
      .refine((v) => v.trim() === '' || /^https?:\/\/\S+$/.test(v.trim()), 'O link deve começar com http:// ou https://.'),
  })
  .superRefine((r, ctx) => {
    if (!r.usuario.trim() && !r.url.trim()) ctx.addIssue({ code: 'custom', path: ['usuario'], message: 'Informe o usuário ou o link.' });
  });

const endereco = z.object({
  tipoId: z.string().min(1, 'Escolha o tipo.'),
  principal: z.boolean(),
  cep: z.string().refine((v) => v === '' || /^\d{8}$/.test(soDigitos(v)), 'CEP deve ter 8 dígitos.'),
  numero: z.string().max(20, 'No máximo 20 caracteres.'),
  complemento: z.string().max(100, 'No máximo 100 caracteres.'),
  rua: z.string().max(255, 'No máximo 255 caracteres.'),
  bairro: z.string().max(100, 'No máximo 100 caracteres.'),
  cidadeId: z.string().min(1, 'Escolha a cidade.'),
  cidadeRotulo: z.string(),
});

const vinculo = z.object({
  pessoaId: z.string().min(1, 'Escolha a pessoa.'),
  pessoaRotulo: z.string(),
  pessoaAtiva: z.boolean(),
  /** `''` = linha nova ainda sem escolha (o `: boolean` evita que o TS infira o predicado e tire o `''` do tipo) */
  tipo: z.enum(['', ...TIPOS_VINCULO]).refine((v): boolean => v !== '', 'Escolha o tipo.'),
  observacao: z.string().max(255, 'No máximo 255 caracteres.'),
});

const base = z.object({
    tipoPessoa: z.enum(['FISICA', 'JURIDICA'], 'Escolha o tipo de pessoa.'),
    nome: z.string().trim().min(1, 'Informe o nome.').max(255, 'No máximo 255 caracteres.'),
    // Só física
    cpf: z.string(),
    rg: z.string().max(20, 'No máximo 20 caracteres.'),
    dataNascimento: z.string(),
    sexo: z.enum(['', 'MASCULINO', 'FEMININO']),
    // Só jurídica
    nomeFantasia: z.string().max(255, 'No máximo 255 caracteres.'),
    cnpj: z.string(),
    inscricaoEstadual: z.string().max(20, 'No máximo 20 caracteres.'),
    inscricaoMunicipal: z.string().max(20, 'No máximo 20 caracteres.'),
    // Classificação
    tiposCadastroIds: z.array(z.string()).min(1, 'Selecione ao menos um tipo de cadastro.'),
    observacao: z.string().max(500, 'No máximo 500 caracteres.'),
    // Listas filhas
    telefones: z.array(telefone),
    emails: z.array(email),
    redesSociais: z.array(redeSocial),
    enderecos: z.array(endereco),
    vinculos: z.array(vinculo),
});

/** Só confere o documento do tipo escolhido (conforto: CPF e CNPJ válidos e únicos são da API). */
export function conferirDocumento(d: { tipoPessoa: 'FISICA' | 'JURIDICA'; cpf: string; cnpj: string }, ctx: z.RefinementCtx): void {
  if (d.tipoPessoa === 'FISICA' && d.cpf !== '' && documentoCru(d.cpf).length !== 11) {
    ctx.addIssue({ code: 'custom', path: ['cpf'], message: 'CPF incompleto.' });
  }
  if (d.tipoPessoa === 'JURIDICA' && d.cnpj !== '' && documentoCru(d.cnpj).length !== 14) {
    ctx.addIssue({ code: 'custom', path: ['cnpj'], message: 'CNPJ incompleto.' });
  }
}

/** Um erro na pessoa de uma linha de vínculo (`vinculos.<indice>.pessoaId`). */
export type ProblemaDeVinculo = { indice: number; mensagem: string };

/**
 * O que o formulário recusa antes de ir à API nos vínculos: a própria pessoa e a pessoa repetida na lista (o par é
 * único). Conforto: a API repete as duas regras (400 no mesmo campo) e confere o resto (empresa PJ, inativa nova...).
 * Linha sem pessoa escolhida fica para o `min(1)` do campo.
 */
export function problemasDeVinculos(vinculos: readonly { pessoaId: string }[], idAberta?: string): ProblemaDeVinculo[] {
  const vistas = new Set<string>();
  const problemas: ProblemaDeVinculo[] = [];
  vinculos.forEach((v, indice) => {
    if (!v.pessoaId) return;
    if (idAberta && v.pessoaId === idAberta) {
      problemas.push({ indice, mensagem: 'Uma pessoa não pode ser vinculada a ela mesma.' });
    } else if (vistas.has(v.pessoaId)) {
      problemas.push({ indice, mensagem: 'Esta pessoa já está na lista.' });
    }
    vistas.add(v.pessoaId);
  });
  return problemas;
}

/** O schema do formulário; `idAberta` é a pessoa em edição (ela não se vincula a si mesma). */
export function criarSchema(idAberta?: string) {
  return base.superRefine((d, ctx) => {
    conferirDocumento(d, ctx);
    for (const p of problemasDeVinculos(d.vinculos, idAberta)) {
      ctx.addIssue({ code: 'custom', path: ['vinculos', p.indice, 'pessoaId'], message: p.mensagem });
    }
  });
}

export const schema = criarSchema();

export type Dados = z.infer<typeof base>;
export type TelefoneForm = Dados['telefones'][number];
export type EmailForm = Dados['emails'][number];
export type RedeSocialForm = Dados['redesSociais'][number];
export type EnderecoForm = Dados['enderecos'][number];
export type VinculoForm = Dados['vinculos'][number];

/** Uma pessoa nova: física, sem nada marcado e sem nenhuma lista. */
export const VAZIO: Dados = {
  tipoPessoa: 'FISICA',
  nome: '',
  cpf: '',
  rg: '',
  dataNascimento: '',
  sexo: '',
  nomeFantasia: '',
  cnpj: '',
  inscricaoEstadual: '',
  inscricaoMunicipal: '',
  tiposCadastroIds: [],
  observacao: '',
  telefones: [],
  emails: [],
  redesSociais: [],
  enderecos: [],
  vinculos: [],
};

/** As linhas que o Acrescentar põe no fim de cada lista (a primeira acrescentada já vem principal, pelo kit). */
export const NOVO_TELEFONE: TelefoneForm = { tipoId: '', numero: '', observacao: '', principal: false };
export const NOVO_EMAIL: EmailForm = { tipoId: '', email: '', observacao: '', principal: false };
export const NOVA_REDE_SOCIAL: RedeSocialForm = { tipoId: '', usuario: '', url: '' };
export const NOVO_ENDERECO: EnderecoForm = {
  tipoId: '',
  principal: false,
  cep: '',
  numero: '',
  complemento: '',
  rua: '',
  bairro: '',
  cidadeId: '',
  cidadeRotulo: '',
};
export const NOVO_VINCULO: VinculoForm = { pessoaId: '', pessoaRotulo: '', pessoaAtiva: true, tipo: '', observacao: '' };

/** Os campos do outro tipo de pessoa: quem troca Física ↔ Jurídica limpa os do bloco que saiu. */
export const CAMPOS_DA_FISICA = ['cpf', 'rg', 'dataNascimento', 'sexo'] as const;
export const CAMPOS_DA_JURIDICA = ['nomeFantasia', 'cnpj', 'inscricaoEstadual', 'inscricaoMunicipal'] as const;

/** Resposta da API → valores do formulário. */
export function paraForm(p: PessoaResponse): Dados {
  return {
    tipoPessoa: p.tipoPessoa,
    nome: p.nome,
    cpf: p.cpf ?? '',
    rg: p.rg ?? '',
    dataNascimento: p.dataNascimento ?? '',
    sexo: p.sexo ?? '',
    nomeFantasia: p.nomeFantasia ?? '',
    cnpj: p.cnpj ?? '',
    inscricaoEstadual: p.inscricaoEstadual ?? '',
    inscricaoMunicipal: p.inscricaoMunicipal ?? '',
    tiposCadastroIds: p.tiposCadastro.map((t) => t.id),
    observacao: p.observacao ?? '',
    telefones: p.telefones.map((t) => ({ tipoId: t.tipo.id, numero: soDigitos(t.numero), observacao: t.observacao ?? '', principal: t.principal })),
    emails: p.emails.map((e) => ({ tipoId: e.tipo.id, email: e.email, observacao: e.observacao ?? '', principal: e.principal })),
    redesSociais: p.redesSociais.map((r) => ({ tipoId: r.tipo.id, usuario: r.usuario ?? '', url: r.url ?? '' })),
    enderecos: p.enderecos.map((e) => ({
      tipoId: e.tipo.id,
      principal: e.principal,
      cep: soDigitos(e.cep ?? ''),
      numero: e.numero ?? '',
      complemento: e.complemento ?? '',
      rua: e.rua ?? '',
      bairro: e.bairro ?? '',
      cidadeId: e.cidade.id,
      cidadeRotulo: rotuloDaCidade(e.cidade),
    })),
    vinculos: p.vinculos.map((v) => ({
      pessoaId: v.pessoa.id,
      pessoaRotulo: rotuloDaPessoa(v.pessoa),
      pessoaAtiva: v.pessoaAtiva,
      tipo: v.tipo,
      observacao: v.observacao ?? '',
    })),
  };
}

const texto = (v: string): string | null => v.trim() || null;

/**
 * Formulário → corpo do POST e do PUT (sem a `version`, que vem do registro lido). Manda `null` nos campos do outro
 * tipo de pessoa; tira `cidadeRotulo` e `pessoaRotulo`; o documento, o CEP e o telefone vão sem pontuação.
 */
export function paraCorpo(d: Dados): PessoaCreate {
  const fisica = d.tipoPessoa === 'FISICA';
  return {
    tipoPessoa: d.tipoPessoa,
    nome: d.nome.trim(),
    cpf: fisica ? documentoCru(d.cpf) || null : null,
    rg: fisica ? texto(d.rg) : null,
    dataNascimento: fisica ? d.dataNascimento || null : null,
    sexo: fisica ? d.sexo || null : null,
    cnpj: fisica ? null : documentoCru(d.cnpj) || null,
    nomeFantasia: fisica ? null : texto(d.nomeFantasia),
    inscricaoEstadual: fisica ? null : texto(d.inscricaoEstadual),
    inscricaoMunicipal: fisica ? null : texto(d.inscricaoMunicipal),
    observacao: texto(d.observacao),
    tiposCadastroIds: d.tiposCadastroIds,
    telefones: d.telefones.map((t) => ({ tipoId: t.tipoId, numero: soDigitos(t.numero), observacao: texto(t.observacao), principal: t.principal })),
    emails: d.emails.map((e) => ({ tipoId: e.tipoId, email: e.email.trim(), observacao: texto(e.observacao), principal: e.principal })),
    redesSociais: d.redesSociais.map((r) => ({ tipoId: r.tipoId, usuario: texto(r.usuario), url: texto(r.url) })),
    enderecos: d.enderecos.map((e) => ({
      tipoId: e.tipoId,
      cep: soDigitos(e.cep) || null,
      cidadeId: e.cidadeId,
      rua: texto(e.rua),
      numero: texto(e.numero),
      bairro: texto(e.bairro),
      complemento: texto(e.complemento),
      principal: e.principal,
    })),
    // linha sem tipo escolhido nem chega aqui (o schema recusa); o `flatMap` só tira o `''` do tipo
    vinculos: d.vinculos.flatMap((v) => (v.tipo === '' ? [] : [{ pessoaId: v.pessoaId, tipo: v.tipo, observacao: texto(v.observacao) }])),
  };
}

/**
 * As caixas de "Tipos de cadastro": os ativos e, depois, os **já gravados** que estão inativos (com a dica "Inativo").
 * Um inativo desmarcado fica desabilitado: não se volta a marcar o que deixou de valer.
 */
export function opcoesDosTiposDeCadastro(
  ativos: readonly { id: string; nome: string; ativo: boolean }[],
  gravados: readonly { id: string; nome: string; ativo: boolean }[],
  marcados: readonly string[],
): OpcaoCheckBox[] {
  const opcoes: OpcaoCheckBox[] = ativos.filter((t) => t.ativo).map((t) => ({ valor: t.id, rotulo: t.nome }));
  for (const g of gravados) {
    if (g.ativo || opcoes.some((o) => o.valor === g.id)) continue;
    opcoes.push({ valor: g.id, rotulo: g.nome, dica: 'Inativo', desabilitada: !marcados.includes(g.id) });
  }
  return opcoes;
}
