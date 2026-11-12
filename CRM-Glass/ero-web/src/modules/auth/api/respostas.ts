import { ErroApi, textoPadrao } from '../../../shared/api/erros';

/*
 * Como a etapa do código reage a cada erro do `POST /api/auth/2fa/verificar`. Os dois 401 se separam
 * pelo `codigo` do ProblemDetail, nunca pelo texto:
 *   DESAFIO_EXPIRADO → desafio ou código vencido, já usado ou substituído, anterior à troca de senha
 *                      ou apagado no bloqueio: volta às credenciais com o `detail` num Alerta.
 *   CODIGO_INVALIDO  → código errado (e também conta bloqueada ou inativa, sem dizer qual): fica na
 *                      etapa, limpa as casas, marca inválido e devolve o foco.
 */

export const COD_DESAFIO_EXPIRADO = 'DESAFIO_EXPIRADO';
export const COD_CODIGO_INVALIDO = 'CODIGO_INVALIDO';

export type ReacaoVerificar =
  /** fica na etapa: limpa, marca o campo e devolve o foco */
  | { tipo: 'codigo-invalido'; mensagem: string }
  /** o desafio não vale mais: volta às credenciais com o aviso */
  | { tipo: 'recomecar'; mensagem: string }
  /** 400 de validação: mensagem no campo do código */
  | { tipo: 'campo'; mensagem: string }
  /** fica na etapa com um Alerta (muitas tentativas, servidor, rede) */
  | { tipo: 'aviso'; tom: 'aviso' | 'perigo'; mensagem: string; correlationId?: string };

export function reacaoAoVerificar(e: unknown): ReacaoVerificar {
  if (!(e instanceof ErroApi)) return { tipo: 'aviso', tom: 'perigo', mensagem: textoPadrao(0) };
  if (e.status === 401) {
    if (e.codigo === COD_CODIGO_INVALIDO) return { tipo: 'codigo-invalido', mensagem: e.detail };
    // DESAFIO_EXPIRADO e qualquer outro 401: o desafio não serve mais, recomeça pelas credenciais.
    return { tipo: 'recomecar', mensagem: e.detail };
  }
  if (e.status === 400) return { tipo: 'campo', mensagem: e.doCampo('codigo') ?? e.detail };
  if (e.status === 429) {
    return {
      tipo: 'aviso',
      tom: 'aviso',
      mensagem: e.retryAfter ? `Muitas tentativas. Aguarde ${e.retryAfter} s e tente de novo.` : e.detail,
    };
  }
  if (e.semConexao) return { tipo: 'aviso', tom: 'perigo', mensagem: e.detail };
  return { tipo: 'aviso', tom: e.status === 503 ? 'aviso' : 'perigo', mensagem: e.detail, correlationId: e.correlationId };
}
