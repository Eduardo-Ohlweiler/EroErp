import { z } from 'zod';
import { api } from '../../../shared/api/cliente';
import { autenticacaoRespostaSchema, type AutenticacaoResposta } from '../../../shared/api/tipos';

/*
 * Login em duas etapas (ero-api, /api/auth):
 *   POST /login {email, senha}         → desafio + código enviado por e-mail (sem cookie)
 *   POST /2fa/verificar {desafio, codigo} → token de acesso + usuário + cookie httpOnly do refresh
 *                                         (401 separado pelo `codigo`: ver respostas.ts)
 *   POST /2fa/reenviar {desafio}       → reenvia o MESMO código (a cada 60 s, até 5 vezes)
 *   PUT  /senha {senhaAtual, novaSenha} → 204 (troca obrigatória da senha temporária)
 */

/** CodigoEnviadoDto */
export const codigoEnviadoSchema = z.object({
  emailMascarado: z.string(),
  codigoExpiraEm: z.string(),
  reenvioDisponivelEm: z.string(),
});
export type CodigoEnviado = z.infer<typeof codigoEnviadoSchema>;

export const authApi = {
  entrar: (dados: { email: string; senha: string }): Promise<AutenticacaoResposta> =>
    api.requisitar('/api/auth/login', { metodo: 'POST', corpo: dados, publica: true, schema: autenticacaoRespostaSchema }),

  verificar: (dados: { desafio: string; codigo: string }): Promise<AutenticacaoResposta> =>
    api.requisitar('/api/auth/2fa/verificar', { metodo: 'POST', corpo: dados, publica: true, schema: autenticacaoRespostaSchema }),

  reenviar: (dados: { desafio: string }): Promise<CodigoEnviado> =>
    api.requisitar('/api/auth/2fa/reenviar', { metodo: 'POST', corpo: dados, publica: true, schema: codigoEnviadoSchema }),

  trocarSenha: (dados: { senhaAtual: string; novaSenha: string }): Promise<void> =>
    api.requisitar<void>('/api/auth/senha', { metodo: 'PUT', corpo: dados }),
};
