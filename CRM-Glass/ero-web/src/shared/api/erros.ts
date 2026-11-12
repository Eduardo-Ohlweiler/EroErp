/**
 * Erros da ero-api. Toda resposta de erro vem como ProblemDetail (RFC 9457) com `codigo`, `correlationId`
 * e, na validação, `erros[{campo, mensagem}]` para mostrar em cada campo. O 429 traz `Retry-After`.
 */

export type ErroDeCampo = { campo: string; mensagem: string };

/** Corpo de erro da API (ProblemDetail + extensões da ero-api). */
export type ProblemDetail = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  codigo?: string;
  correlationId?: string;
  erros?: ErroDeCampo[];
};

/** Textos quando a resposta não traz `detail` (ou nem chega). */
const TEXTO_POR_STATUS: Record<number, string> = {
  0: 'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.',
  400: 'Existem campos inválidos.',
  401: 'Sessão inválida ou expirada. Faça login de novo.',
  403: 'Você não tem permissão para esta operação.',
  404: 'Não encontramos o que você procurou.',
  409: 'Este registro foi alterado por outra pessoa. Recarregue e tente de novo.',
  422: 'Não foi possível concluir a operação.',
  429: 'Muitas tentativas. Aguarde um pouco e tente de novo.',
};
const TEXTO_SERVIDOR = 'Algo deu errado do nosso lado. Tente de novo em instantes.';

export function textoPadrao(status: number) {
  return TEXTO_POR_STATUS[status] ?? (status >= 500 ? TEXTO_SERVIDOR : 'Não foi possível concluir a operação.');
}

/**
 * `Retry-After` em segundos (inteiro, nunca negativo). Aceita os dois formatos do HTTP:
 * número de segundos ou data HTTP. Ausente ou inválido → null.
 */
export function lerRetryAfter(valor: string | null | undefined, agoraMs = Date.now()): number | null {
  if (valor == null) return null;
  const v = valor.trim();
  if (v === '') return null;
  if (/^\d+$/.test(v)) return Number(v);
  // Data HTTP ("Wed, 11 Nov 2026 12:00:30 GMT"); sem letras não é data (o Date.parse aceitaria "-5" como ano).
  if (!/[a-z]/i.test(v)) return null;
  const data = Date.parse(v);
  if (Number.isNaN(data)) return null;
  return Math.max(0, Math.ceil((data - agoraMs) / 1000));
}

const texto = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v : undefined);

function lerErrosDeCampo(v: unknown): ErroDeCampo[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((e) => {
    if (!e || typeof e !== 'object') return [];
    const { campo, mensagem } = e as Record<string, unknown>;
    return typeof campo === 'string' && typeof mensagem === 'string' ? [{ campo, mensagem }] : [];
  });
}

/** Erro de uma chamada à API, já com os campos do ProblemDetail tipados. */
export class ErroApi extends Error {
  /** status HTTP; 0 = sem resposta (rede, servidor fora do ar) */
  readonly status: number;
  /** código estável da ero-api (VALIDACAO, NAO_AUTENTICADO, REGRA_NEGOCIO, SERVICO_INDISPONIVEL...) */
  readonly codigo: string;
  /** mensagem para a pessoa, em português (o `detail`) */
  readonly detail: string;
  readonly titulo?: string;
  /** erros por campo (400 de validação) */
  readonly erros: ErroDeCampo[];
  /** para o suporte achar a requisição no log */
  readonly correlationId?: string;
  /** segundos até poder tentar de novo (429) */
  readonly retryAfter: number | null;

  constructor(dados: {
    status: number;
    codigo?: string;
    detail?: string;
    titulo?: string;
    erros?: ErroDeCampo[];
    correlationId?: string;
    retryAfter?: number | null;
  }) {
    const detail = dados.detail ?? textoPadrao(dados.status);
    super(detail);
    this.name = 'ErroApi';
    this.status = dados.status;
    this.codigo = dados.codigo ?? (dados.status === 0 ? 'REDE' : `HTTP_${dados.status}`);
    this.detail = detail;
    this.titulo = dados.titulo;
    this.erros = dados.erros ?? [];
    this.correlationId = dados.correlationId;
    this.retryAfter = dados.retryAfter ?? null;
  }

  /** sem resposta do servidor (rede, proxy sem API) */
  get semConexao() {
    return this.status === 0;
  }

  /** mensagem de um campo (400 de validação), se houver */
  doCampo(campo: string) {
    return this.erros.find((e) => e.campo === campo)?.mensagem;
  }
}

/** ProblemDetail (ou qualquer corpo) + status + Retry-After → ErroApi. Função pura (testável). */
export function erroDeProblemDetail(status: number, corpo: unknown, retryAfter: string | null = null, agoraMs = Date.now()): ErroApi {
  const o = corpo && typeof corpo === 'object' ? (corpo as Record<string, unknown>) : {};
  return new ErroApi({
    status,
    codigo: texto(o.codigo),
    detail: texto(o.detail),
    titulo: texto(o.title),
    erros: lerErrosDeCampo(o.erros),
    correlationId: texto(o.correlationId),
    retryAfter: lerRetryAfter(retryAfter, agoraMs),
  });
}

/** Resposta HTTP de erro → ErroApi (lê o corpo se for JSON; senão, usa o texto padrão do status). */
export async function erroDeResposta(res: Response): Promise<ErroApi> {
  let corpo: unknown = null;
  const tipo = res.headers.get('Content-Type') ?? '';
  if (tipo.includes('json')) corpo = await res.json().catch(() => null);
  return erroDeProblemDetail(res.status, corpo, res.headers.get('Retry-After'));
}

export const erroDeRede = () => new ErroApi({ status: 0 });
