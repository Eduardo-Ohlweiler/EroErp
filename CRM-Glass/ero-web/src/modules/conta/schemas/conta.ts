import { z } from 'zod';
import type { TemaApi } from '../../../shared/api/tipos';
import { rotuloDoPapel } from '../../../shared/sessao/rotulos';
import { telefoneOpcionalSchema, telefoneParaApi, telefoneParaForm } from '../../../shared/util/telefone';
import type { MeuPerfil, MeuPerfilUpdate } from '../api/conta';

/*
 * Formulários da Minha conta, um por aba (o `useForm` de cada uma mora na tela, fora do TTabPanel). Espelham o
 * MeuPerfilUpdateDto e o TrocarSenhaDto (mesmos nomes de campo, para o 400 cair no campo certo). Validação aqui é
 * conforto: a política de senha (12+, sem o nome nem o e-mail) e o resto são da API.
 */

/** "Seguir o contratante" é o `null` do `PUT /api/auth/eu/tema`. */
export const TEMA_DO_CONTRATANTE = 'CONTRATANTE';
export type TemaDoForm = typeof TEMA_DO_CONTRATANTE | TemaApi;

export const TEMA_OPCOES = [
  { valor: TEMA_DO_CONTRATANTE, rotulo: 'Seguir o contratante' },
  { valor: 'CLARO', rotulo: 'Claro' },
  { valor: 'ESCURO', rotulo: 'Escuro' },
];

export const schemaDados = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(150, 'No máximo 150 caracteres.'),
  telefone: telefoneOpcionalSchema,
  tema: z.enum([TEMA_DO_CONTRATANTE, 'CLARO', 'ESCURO']),
  // só leitura (e-mail é o segundo fator do login; papel e contratante não mudam aqui): não vão para a API
  email: z.string(),
  contratante: z.string(),
  papel: z.string(),
});
export type DadosConta = z.infer<typeof schemaDados>;

export const DADOS_VAZIOS: DadosConta = { nome: '', telefone: '', tema: TEMA_DO_CONTRATANTE, email: '', contratante: '', papel: '' };

/** Perfil da API + tema da sessão → formulário. */
export const paraForm = (p: MeuPerfil, tema: TemaApi | null | undefined): DadosConta => ({
  nome: p.nome,
  telefone: telefoneParaForm(p.telefone),
  tema: tema ?? TEMA_DO_CONTRATANTE,
  email: p.email,
  contratante: p.tenantNome?.trim() || 'Plataforma',
  papel: rotuloDoPapel(p.papel),
});

/** Formulário → corpo do `PUT /api/auth/eu/perfil` (nome e telefone, com a version lida). */
export const paraCorpo = (d: DadosConta, version: number): MeuPerfilUpdate => ({
  nome: d.nome.trim(),
  telefone: telefoneParaApi(d.telefone),
  version,
});

/** Tema do formulário → o do `PUT /api/auth/eu/tema` (`null` segue o contratante). */
export const temaParaApi = (t: DadosConta['tema']): TemaApi | null => (t === TEMA_DO_CONTRATANTE ? null : t);

export const SENHA_MINIMO = 12;

export const schemaSenha = z
  .object({
    senhaAtual: z.string().min(1, 'Informe a senha atual.').max(128, 'Senha inválida.'),
    novaSenha: z
      .string()
      .min(SENHA_MINIMO, `Use ${SENHA_MINIMO} ou mais caracteres.`)
      .max(128, 'No máximo 128 caracteres.'),
    confirmar: z.string(),
  })
  .refine((d) => d.confirmar === d.novaSenha, { path: ['confirmar'], message: 'A confirmação não confere com a nova senha.' });
export type DadosSenha = z.infer<typeof schemaSenha>;

export const SENHA_VAZIA: DadosSenha = { senhaAtual: '', novaSenha: '', confirmar: '' };
