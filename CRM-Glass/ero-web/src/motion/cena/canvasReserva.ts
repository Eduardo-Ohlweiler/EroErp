/*
 * Canvas WebGL reservado. Criar um contexto WebGL custa de ~70 a ~330 ms numa GPU integrada, e mais quando a
 * GPU está ocupada pintando a casca que entra. A cena do contratante nasce justamente aí (login → Início,
 * troca de contratante). Por isso um canvas com contexto fica pronto de antemão, criado em tempo ocioso
 * (o LiveBackground agenda ao abrir a página e depois de cada adoção), e a cena só o adota.
 * Mantém no máximo um contexto parado; o limite do navegador é ~16 por aba.
 */

/** Atributos do contexto da cena (os mesmos do Renderizador: o getContext devolve o contexto já criado). */
export const ATRIBUTOS_CENA: WebGLContextAttributes = { alpha: false, antialias: false, premultipliedAlpha: false };

let reserva: HTMLCanvasElement | null = null;

/** Cria o canvas reservado, se ainda não houver. Chamar em tempo ocioso. */
export function reservarCanvas() {
  if (reserva || typeof WebGL2RenderingContext === 'undefined') return;
  try {
    const cv = document.createElement('canvas');
    if (cv.getContext('webgl2', ATRIBUTOS_CENA)) reserva = cv;
  } catch {
    /* sem WebGL 2: a cena cai nas fotos esmaecendo */
  }
}

/** Entrega o canvas reservado (ou um novo, se não houver) e agenda a próxima reserva. */
export function pegarCanvas(agendar: (f: () => void) => void) {
  const cv = reserva ?? document.createElement('canvas');
  reserva = null;
  agendar(reservarCanvas);
  return cv;
}

type JanelaOcioso = Window & {
  requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/** Roda `f` em tempo ocioso (ou depois de `limite` segundos). Devolve a função que cancela. */
export function quandoOcioso(f: () => void, limite: number) {
  const w = window as JanelaOcioso;
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(f, { timeout: limite * 1000 });
    return () => w.cancelIdleCallback?.(id);
  }
  const t = setTimeout(f, limite * 1000);
  return () => clearTimeout(t);
}
