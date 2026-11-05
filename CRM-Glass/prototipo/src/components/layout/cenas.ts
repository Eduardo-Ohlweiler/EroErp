/**
 * Cenas fotográficas para o fundo. Coordenadas em % da própria foto (a foto é 16:9 e
 * cobre a tela mantendo a proporção, então as % continuam batendo em qualquer janela).
 */

export type Luminaria = {
  /** centro, em % da largura */
  x: number;
  /** centro, em % da altura */
  y: number;
  /** largura da luminária, em % da largura — define o brilho e a área que ela clareia */
  w: number;
};

export type Cena = {
  id: string;
  /** foto com as luzes acesas, de dia */
  dia: string;
  /** foto da mesma cena à noite, luzes apagadas; sem ela a noite é derivada por filtro */
  noite?: string;
  /** largura / altura da foto */
  proporcao: number;
  /** na ordem em que acendem (da frente para o fundo) */
  luzes: Luminaria[];
  /** área da janela, como elipse em % */
  janela: { x: number; y: number; rx: number; ry: number };
  /** ajustes de geometria que dependem da foto */
  ajuste: {
    /** área clareada por luminária: raio = largura × fator, limitado entre min e max (% da largura) */
    alcance: { fator: number; min: number; max: number; achatamento: number };
    /** tamanho do brilho em relação à largura da luminária */
    brilho: { largura: number; altura: number };
  };
};

const base = import.meta.env.BASE_URL;

/**
 * Par dia/noite gerado por IA (Gemini) a partir da composição escolhida; mesmo enquadramento.
 * 1672×941, WebP. Luminárias medidas na foto de dia (fileiras da frente para o fundo).
 */
export const ESCRITORIO: Cena = {
  id: 'escritorio',
  dia: `${base}cenas/escritorio/dia.webp`,
  noite: `${base}cenas/escritorio/noite.webp`,
  proporcao: 1672 / 941,
  luzes: [
    // fileira 1 (frente)
    { x: 24.6, y: 6.7, w: 12.6 },
    { x: 57.4, y: 6.7, w: 10.7 },
    { x: 89.1, y: 6.7, w: 13.2 },
    // fileira 2
    { x: 32.1, y: 20, w: 7.2 },
    { x: 54.8, y: 20, w: 7.2 },
    { x: 76.7, y: 20, w: 8.2 },
    // fileira 3
    { x: 37.6, y: 26.6, w: 4.3 },
    { x: 53.5, y: 26.6, w: 5.4 },
    { x: 70.4, y: 26.6, w: 5.9 },
    { x: 92.9, y: 27.6, w: 4.4 },
    // fileira 4
    { x: 39.7, y: 30.7, w: 2.6 },
    { x: 52.7, y: 30.7, w: 4.4 },
    { x: 66.4, y: 30.7, w: 4.5 },
    { x: 83.6, y: 29.6, w: 5 },
    // fileira 5
    { x: 40.4, y: 33.3, w: 3.7 },
    { x: 52.2, y: 33.3, w: 3.8 },
    { x: 63.8, y: 33.3, w: 3.6 },
    // fileira 6 (fundo)
    { x: 41.5, y: 35.1, w: 3.2 },
    { x: 51.9, y: 35.1, w: 3.2 },
    { x: 62.1, y: 35.1, w: 2.9 },
  ],
  janela: { x: 17, y: 40, rx: 26, ry: 52 },
  ajuste: {
    alcance: { fator: 2.2, min: 6, max: 20, achatamento: 0.9 },
    brilho: { largura: 1.5, altura: 0.3 },
  },
};
