import { z } from 'zod';
import { tipoPorChave, type TipoSelect } from '../../../shared/api/auxiliares';
import { documentoCru, soDigitos } from '../../../shared/util/format';
import { SEM_COMPLEMENTOS, type PessoaCreate } from '../api/pessoas';
import { conferirDocumento } from './pessoa';

/*
 * Cadastro rápido de pessoa (o modal aberto pelo combo de vínculos): o mínimo para existir. A forma dos campos é a do
 * PessoaCreateDto (`telefones.0.numero`), para o 400 e o 409 da API caírem no campo certo. Conforto: a regra é da API.
 */

export const schemaRapido = z
  .object({
    tipoPessoa: z.enum(['FISICA', 'JURIDICA'], 'Escolha o tipo de pessoa.'),
    nome: z.string().trim().min(1, 'Informe o nome.').max(255, 'No máximo 255 caracteres.'),
    cpf: z.string(),
    dataNascimento: z.string(),
    sexo: z.enum(['', 'MASCULINO', 'FEMININO']),
    cnpj: z.string(),
    tiposCadastroIds: z.array(z.string()).min(1, 'Selecione ao menos um tipo de cadastro.'),
    /** uma linha só, opcional: sem número, a pessoa nasce sem telefone */
    telefones: z.array(
      z.object({
        numero: z.string().refine((v) => v === '' || /^\d{10,11}$/.test(soDigitos(v)), 'Telefone deve ter 10 ou 11 dígitos.'),
      }),
    ),
  })
  .superRefine(conferirDocumento);

export type DadosRapidos = z.infer<typeof schemaRapido>;

/** Pessoa nova do cadastro rápido: física, com "Cliente" (item do sistema, por `chave`) já marcado (P3 do plano). */
export function vazioRapido(tiposCadastro: readonly TipoSelect[]): DadosRapidos {
  const cliente = tipoPorChave(tiposCadastro, 'CLIENTE');
  return {
    tipoPessoa: 'FISICA',
    nome: '',
    cpf: '',
    dataNascimento: '',
    sexo: '',
    cnpj: '',
    tiposCadastroIds: cliente ? [cliente.id] : [],
    telefones: [{ numero: '' }],
  };
}

/** O número digitado só com dígitos, ou `null` quando ficou em branco. */
export const telefoneDoRapido = (d: DadosRapidos): string | null => soDigitos(d.telefones[0]?.numero ?? '') || null;

/**
 * Formulário rápido → `POST /api/pessoas`. Manda `null` nos campos do outro tipo e nenhuma lista além dos tipos de
 * cadastro e do telefone (principal, do tipo `tipoCelularId`, o item do sistema "Celular"). Sem número ou sem o tipo,
 * a pessoa vai sem telefone: quem chama avisa antes quando há número e falta o tipo.
 */
export function paraCorpoRapido(d: DadosRapidos, tipoCelularId: string | undefined): PessoaCreate {
  const fisica = d.tipoPessoa === 'FISICA';
  const numero = telefoneDoRapido(d);
  return {
    tipoPessoa: d.tipoPessoa,
    nome: d.nome.trim(),
    cpf: fisica ? documentoCru(d.cpf) || null : null,
    rg: null,
    dataNascimento: fisica ? d.dataNascimento || null : null,
    sexo: fisica ? d.sexo || null : null,
    cnpj: fisica ? null : documentoCru(d.cnpj) || null,
    nomeFantasia: null,
    inscricaoEstadual: null,
    inscricaoMunicipal: null,
    observacao: null,
    tiposCadastroIds: d.tiposCadastroIds,
    telefones: numero && tipoCelularId ? [{ tipoId: tipoCelularId, numero, observacao: null, principal: true }] : [],
    emails: [],
    redesSociais: [],
    enderecos: [],
    vinculos: [],
    ...SEM_COMPLEMENTOS,
  };
}
