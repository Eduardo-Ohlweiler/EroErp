import type { ColunaExportavel, OpcaoCombo } from '../../../design-system/kit';
import { documentoCru, formatarDocumento, paraNumero } from '../../../shared/util/format';
import { formatarTelefone } from '../../../shared/util/telefone';
import type { FiltrosPessoaApi, PessoaLista, TipoPessoa } from '../api/pessoas';

/*
 * Filtros da lista de Pessoas e o que a exportação escreve. Validação aqui é conforto: a consulta e as regras são da API.
 * `ativo` e os ids ficam como texto no formulário (o combo grava texto); `paraConsulta` converte.
 */

export type FiltrosPessoa = {
  codPessoa: string;
  busca: string;
  documento: string;
  tipoPessoa: '' | TipoPessoa;
  tipoCadastroId: string;
  ativo: '' | 'true' | 'false';
};

/** A situação abre em Ativas (decisão do dono, como Contratantes e Usuários). */
export const FILTROS_VAZIOS: FiltrosPessoa = {
  codPessoa: '',
  busca: '',
  documento: '',
  tipoPessoa: '',
  tipoCadastroId: '',
  ativo: 'true',
};

export const TIPO_PESSOA_OPCOES: OpcaoCombo[] = [
  { valor: 'FISICA', rotulo: 'Física' },
  { valor: 'JURIDICA', rotulo: 'Jurídica' },
];

export const rotuloDoTipoPessoa = (t: TipoPessoa) => (t === 'FISICA' ? 'Física' : 'Jurídica');

/** Filtros do formulário → parâmetros da API (vazio = todas; o documento vai sem pontuação). */
export function paraConsulta(f: FiltrosPessoa): Omit<FiltrosPessoaApi, 'page' | 'size' | 'sort'> {
  const codigo = paraNumero(f.codPessoa);
  return {
    codPessoa: codigo !== undefined && codigo > 0 ? codigo : undefined,
    busca: f.busca.trim() || undefined,
    documento: documentoCru(f.documento) || undefined,
    tipoPessoa: f.tipoPessoa || undefined,
    tipoCadastroId: f.tipoCadastroId || undefined,
    ativo: f.ativo === '' ? undefined : f.ativo === 'true',
  };
}

/** "Maria Silva · Maria Moda": o nome e, se houver, a fantasia (exportação). */
export const nomeComFantasia = (p: Pick<PessoaLista, 'nome' | 'nomeFantasia'>) =>
  p.nomeFantasia ? `${p.nome} · ${p.nomeFantasia}` : p.nome;

/** "Porto Alegre/RS"; só a cidade se faltar a UF; vazio se não houver endereço. */
export function cidadeUf(p: Pick<PessoaLista, 'cidadePrincipal' | 'ufPrincipal'>): string {
  if (!p.cidadePrincipal) return '';
  return p.ufPrincipal ? `${p.cidadePrincipal}/${p.ufPrincipal}` : p.cidadePrincipal;
}

/** "Cliente, Fornecedor" (por nome, como a API manda). */
export const tiposDe = (p: Pick<PessoaLista, 'tiposCadastro'>) => p.tiposCadastro.map((t) => t.nome).join(', ');

/** Exportar e Pdf: sem data de nascimento nem RG (decisão do dono). */
export const colunasExportadas: ColunaExportavel<PessoaLista>[] = [
  { titulo: 'Código', numerica: true, semQuebra: true, valor: (p) => String(p.codPessoa) },
  { titulo: 'Nome', valor: nomeComFantasia },
  { titulo: 'CPF/CNPJ', semQuebra: true, valor: (p) => (p.documento ? formatarDocumento(p.documento) : '') },
  { titulo: 'Tipos', valor: tiposDe },
  { titulo: 'Telefone', semQuebra: true, valor: (p) => (p.telefonePrincipal ? formatarTelefone(p.telefonePrincipal) : '') },
  { titulo: 'E-mail', quebra: 'email', valor: (p) => p.emailPrincipal ?? '' },
  { titulo: 'Cidade/UF', valor: cidadeUf },
  { titulo: 'Situação', valor: (p) => (p.ativo ? 'Ativo' : 'Inativo') },
];
