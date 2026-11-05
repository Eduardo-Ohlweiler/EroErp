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

const AJUSTE_PADRAO: Cena['ajuste'] = {
  alcance: { fator: 2.6, min: 6, max: 20, achatamento: 0.9 },
  brilho: { largura: 1.9, altura: 0.45 },
};

const base = import.meta.env.BASE_URL;

/**
 * PROVISÓRIA: prévia de banco de imagens só para aprovar o movimento.
 * Não vai para o produto — será trocada pelo par dia/noite gerado por IA.
 */
export const ESCRITORIO: Cena = {
  id: 'escritorio',
  dia: `${base}cenas/_provisorio/escritorio-dia.jpg`,
  proporcao: 16 / 9,
  luzes: [
    // fileira 1 (frente)
    { x: 28.6, y: 14, w: 7.4 },
    { x: 57.2, y: 14, w: 6.2 },
    { x: 85.7, y: 14, w: 7.6 },
    // fileira 2
    { x: 36.6, y: 27, w: 2.9 },
    { x: 54.5, y: 27, w: 3.8 },
    { x: 72.7, y: 27, w: 4.4 },
    { x: 90.7, y: 27, w: 4.8 },
    // fileira 3
    { x: 40.1, y: 33, w: 1.8 },
    { x: 53.3, y: 33, w: 2.6 },
    { x: 66.6, y: 33, w: 2.7 },
    // fileira 4 (fundo)
    { x: 42.1, y: 36.7, w: 2 },
    { x: 52.7, y: 36.7, w: 1.4 },
    { x: 63.1, y: 36.7, w: 2 },
  ],
  janela: { x: 17, y: 44, rx: 27, ry: 50 },
  ajuste: AJUSTE_PADRAO,
};
