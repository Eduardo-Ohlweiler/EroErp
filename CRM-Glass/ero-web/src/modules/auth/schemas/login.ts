import { z } from 'zod';

/** Etapa 1: e-mail e senha. A senha não é aparada (espaço pode fazer parte dela). */
export const credenciaisSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail.').email('Informe um e-mail válido.'),
  senha: z.string().min(1, 'Informe a senha.'),
});
export type Credenciais = z.infer<typeof credenciaisSchema>;

/** Mínimo da política de senha da API (as outras regras, a API confere e devolve no 422). */
export const TAMANHO_MINIMO_SENHA = 12;

/**
 * Etapa 3: troca obrigatória da senha temporária. A senha atual só é pedida quando o login não a tem
 * em memória (a pessoa recarregou a página com a pendência).
 */
export function trocarSenhaSchema(pedirAtual: boolean) {
  return z
    .object({
      senhaAtual: pedirAtual ? z.string().min(1, 'Informe a senha atual.') : z.string().optional(),
      novaSenha: z.string().min(TAMANHO_MINIMO_SENHA, `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`),
      confirmar: z.string().min(1, 'Repita a nova senha.'),
    })
    .refine((d) => d.novaSenha === d.confirmar, { path: ['confirmar'], message: 'As senhas não conferem.' });
}
export type TrocarSenha = z.infer<ReturnType<typeof trocarSenhaSchema>>;
