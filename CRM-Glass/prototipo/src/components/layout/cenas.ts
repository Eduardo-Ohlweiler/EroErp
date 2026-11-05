/**
 * Cenas fotográficas para o fundo (renderizadas pelo shader em SceneShader.ts).
 * Coordenadas em % da própria foto; a foto cobre a tela mantendo a proporção.
 *
 * Cada cena tem a foto de dia, a de noite (mesmo enquadramento, alinhadas pixel a pixel)
 * e uma textura de máscaras gerada por `scripts/cena-mascaras.py`:
 *   R = exterior (janela ou céu) · G = brilho das luminárias (interna) ou céu (externa) · B = luzes da cidade · A = água
 */

export type Luminaria = {
  /** centro, em % da largura */
  x: number;
  /** centro, em % da altura */
  y: number;
  /** largura da luminária, em % da largura */
  w: number;
  /** fileira (0 = a mais próxima); luminárias da mesma fileira acendem juntas, como um circuito */
  fileira: number;
};

export type Cena = {
  id: string;
  nome: string;
  /** interna: luminárias e janela · externa: céu, estrelas, água */
  tipo: 'interior' | 'exterior';
  /** linha d'água em fração da altura (cenas com reflexo) */
  horizonte?: number;
  dia: string;
  noite: string;
  mascaras: string;
  /** largura / altura da foto */
  proporcao: number;
  /** vazio em cenas externas (cidade): aí só o céu e as luzes da cidade mudam */
  luzes: Luminaria[];
  /** quanto cada luminária ilumina em volta: raio = base + largura × fator (em fração da altura) */
  alcance: { base: number; fator: number };
};

const base = import.meta.env.BASE_URL;

/**
 * Par dia/noite gerado por IA (Gemini) a partir da composição escolhida; 1672×941, WebP.
 * Luminárias medidas na foto de dia.
 */
export const ESCRITORIO: Cena = {
  id: 'escritorio',
  nome: 'Escritório',
  tipo: 'interior',
  dia: `${base}cenas/escritorio/dia.webp`,
  noite: `${base}cenas/escritorio/noite.webp`,
  mascaras: `${base}cenas/escritorio/mascaras.png`,
  proporcao: 1672 / 941,
  luzes: [
    { x: 24.6, y: 6.7, w: 12.6, fileira: 0 },
    { x: 57.4, y: 6.7, w: 10.7, fileira: 0 },
    { x: 89.1, y: 6.7, w: 13.2, fileira: 0 },
    { x: 32.1, y: 20, w: 7.2, fileira: 1 },
    { x: 54.8, y: 20, w: 7.2, fileira: 1 },
    { x: 76.7, y: 20, w: 8.2, fileira: 1 },
    { x: 37.6, y: 26.6, w: 4.3, fileira: 2 },
    { x: 53.5, y: 26.6, w: 5.4, fileira: 2 },
    { x: 70.4, y: 26.6, w: 5.9, fileira: 2 },
    { x: 92.9, y: 27.6, w: 4.4, fileira: 2 },
    { x: 39.7, y: 30.7, w: 2.6, fileira: 3 },
    { x: 52.7, y: 30.7, w: 4.4, fileira: 3 },
    { x: 66.4, y: 30.7, w: 4.5, fileira: 3 },
    { x: 83.6, y: 29.6, w: 5, fileira: 3 },
    { x: 40.4, y: 33.3, w: 3.7, fileira: 4 },
    { x: 52.2, y: 33.3, w: 3.8, fileira: 4 },
    { x: 63.8, y: 33.3, w: 3.6, fileira: 4 },
    { x: 41.5, y: 35.1, w: 3.2, fileira: 5 },
    { x: 51.9, y: 35.1, w: 3.2, fileira: 5 },
    { x: 62.1, y: 35.1, w: 2.9, fileira: 5 },
  ],
  alcance: { base: 0.1, fator: 1.1 },
};

/**
 * Orla com prédios e reflexo na água. Par gerado no Gemini (05/11/2026) com a foto de referência só como
 * composição; a noite foi retocada (logotipos, neons e letreiros removidos; luzes vermelhas e azuis
 * trocadas por luz quente). 1376×768, WebP. Sem luminárias: muda o céu, as janelas e a água.
 */
export const CIDADE: Cena = {
  id: 'cidade',
  nome: 'Cidade',
  tipo: 'exterior',
  dia: `${base}cenas/cidade/dia.webp`,
  noite: `${base}cenas/cidade/noite.webp`,
  mascaras: `${base}cenas/cidade/mascaras.png`,
  proporcao: 1376 / 768,
  luzes: [],
  alcance: { base: 0, fator: 0 },
  horizonte: 535 / 768,
};

export const CENAS = [ESCRITORIO, CIDADE];
