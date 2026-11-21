import { ErroApi, textoPadrao, type ErroDeCampo } from '../../shared/api/erros';

/**
 * O que a tela faz com um erro da API (docs/07 §3.3). Função pura: o `useMessage().erroApi` executa.
 *
 * | Resposta | Tratamento |
 * |---|---|
 * | 400 com `erros[{campo, mensagem}]` | erro no campo (o `campo` é o caminho do DTO, `administrador.email`); o que a tela não tem cai no aviso |
 * | 409 com `erros` (duplicidade: e-mail, documento já usado) | igual ao 400, **sem** Recarregar; nenhum campo na tela → o `detail` num aviso comum |
 * | 409 sem `erros` (conflito de versão) | erro com o botão **Recarregar** |
 * | 429 | aviso com o `retryAfter` em segundos |
 * | 401 | nada: o cliente já tentou renovar e a sessão cai no login |
 * | demais | o `detail` (em português), senão o texto padrão do status |
 */
export type TratamentoDeErro =
  | { tipo: 'campos'; campos: ErroDeCampo[]; semCampo: ErroDeCampo[]; texto: string }
  | { tipo: 'conflito'; texto: string }
  | { tipo: 'espera'; texto: string; segundos: number | null }
  | { tipo: 'nada' }
  | { tipo: 'mensagem'; texto: string; codigo?: string };

const TEXTO_GENERICO = 'Não foi possível concluir a operação.';

/** "42 segundos", "1 segundo", "3 minutos" (arredonda o minuto para cima). */
export function textoDeEspera(segundos: number): string {
  if (segundos < 60) return `${segundos} ${segundos === 1 ? 'segundo' : 'segundos'}`;
  const min = Math.ceil(segundos / 60);
  return `${min} ${min === 1 ? 'minuto' : 'minutos'}`;
}

/**
 * O aviso que acompanha um erro de campo (400 ou 409 com `erros`), ou `null` quando todos os campos foram marcados.
 * Nunca tem botão de ação: duplicidade e validação se resolvem corrigindo o campo, não recarregando.
 */
export function avisoDosCampos(t: Extract<TratamentoDeErro, { tipo: 'campos' }>): { titulo: string; descricao?: string } | null {
  if (t.semCampo.length === 0 && t.campos.length > 0) return null;
  return { titulo: t.texto, descricao: t.semCampo.map((c) => c.mensagem).join(' ') || undefined };
}

/**
 * O caminho do campo como o `react-hook-form` o conhece: o Bean Validation manda a posição da lista entre colchetes
 * (`telefones[0].numero`), e o formulário usa ponto (`telefones.0.numero`, o `name` que o `TFieldList` dá ao campo).
 */
export function caminhoDoCampo(campo: string): string {
  return campo.replace(/\[(\d+)\]/g, '.$1');
}

/**
 * Classifica o erro. Os caminhos de `erros` saem com ponto no lugar dos colchetes (`caminhoDoCampo`). `temCampo(caminho)` diz se o formulário tem aquele campo (sem formulário, nenhum campo vale).
 */
export function tratarErroApi(e: unknown, temCampo: (campo: string) => boolean = () => false): TratamentoDeErro {
  if (!(e instanceof ErroApi)) return { tipo: 'mensagem', texto: TEXTO_GENERICO };

  if (e.status === 401) return { tipo: 'nada' };

  // 409 com `erros` é duplicidade de campo, não conflito de versão: recarregar não resolve.
  if ((e.status === 400 || e.status === 409) && e.erros.length > 0) {
    const erros = e.erros.map((x) => ({ ...x, campo: caminhoDoCampo(x.campo) }));
    const campos = erros.filter((x) => temCampo(x.campo));
    const semCampo = erros.filter((x) => !temCampo(x.campo));
    return { tipo: 'campos', campos, semCampo, texto: e.detail };
  }

  // 409 sem `erros`: conflito de versão (otimista)
  if (e.status === 409) return { tipo: 'conflito', texto: e.detail || textoPadrao(409) };

  if (e.status === 429) {
    const s = e.retryAfter;
    return { tipo: 'espera', segundos: s, texto: s !== null && s > 0 ? `${e.detail} Tente de novo em ${textoDeEspera(s)}.` : e.detail };
  }

  return { tipo: 'mensagem', texto: e.detail || textoPadrao(e.status), codigo: e.correlationId };
}
