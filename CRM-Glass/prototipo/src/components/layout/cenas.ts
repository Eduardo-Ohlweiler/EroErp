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
  /** foto com cores fortes: os cartões ficam mais opacos enquanto a cena está ativa (tokens.css, data-vidro) */
  vidro?: 'denso';
  /**
   * Como as luzes externas (canal B das máscaras) acendem: grade de colunas × linhas sobre a foto, cada célula
   * no seu tempo; subida (0–1) faz os andares de baixo acenderem primeiro. Padrão: janelas pequenas, ordem sorteada.
   */
  janelas?: Janelas;
};

export type Janelas = {
  colunas: number;
  linhas: number;
  subida: number;
  /** manchas de bordas suaves em vez de células quadradas (fotos desfocadas: cada ponto de luz acende inteiro) */
  suave?: boolean;
};

export const JANELAS_PADRAO: Janelas = { colunas: 260, linhas: 146, subida: 0 };

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

/**
 * Marina com iates, cores fortes. Par editado no Gemini (05/11/2026) a partir de uma foto de Dubai e retocado
 * para tirar o ar de cartão-postal (menos saturação e nitidez artificial). 1262×848, WebP.
 * Atenção: mostra prédios reais com marca registrada; serve para o protótipo, trocar antes de vender.
 * A água que ondula é só a área aberta à direita (os barcos ficam parados). As luzes de qualquer cor entram
 * na máscara (--luz-noite), para o holofote da torre e a fachada do hotel acenderem andar por andar.
 */
export const MARINA: Cena = {
  id: 'marina',
  nome: 'Marina',
  tipo: 'exterior',
  dia: `${base}cenas/marina/dia.webp`,
  noite: `${base}cenas/marina/noite.webp`,
  mascaras: `${base}cenas/marina/mascaras.png`,
  proporcao: 1262 / 848,
  luzes: [],
  alcance: { base: 0, fator: 0 },
  horizonte: 628 / 848,
  vidro: 'denso',
  // Holofotes e fachadas: faixas largas (andares), de baixo para cima.
  janelas: { colunas: 60, linhas: 120, subida: 0.45 },
};

/**
 * Fotos desfocadas (bokeh) de 05/11/2026, ampliadas 3× (o desfoque esconde a resolução baixa da original).
 * Sem céu nem água: no tema escuro as luzes acendem ponto a ponto, em manchas suaves; no claro, apagam.
 * Licença: fotos de banco de imagens gratuito; antes de vender, licenciar a versão em alta ou gerar equivalente.
 */
/** Escritório envidraçado no fim do dia, luzes quentes. A original é a noite; o dia foi derivado (mais exposição, branco neutro). */
export const EXPEDIENTE: Cena = {
  id: 'expediente',
  nome: 'Expediente',
  tipo: 'exterior',
  dia: `${base}cenas/expediente/dia.webp`,
  noite: `${base}cenas/expediente/noite.webp`,
  mascaras: `${base}cenas/expediente/mascaras.png`,
  proporcao: 1575 / 1050,
  luzes: [],
  alcance: { base: 0, fator: 0 },
  janelas: { colunas: 14, linhas: 9, subida: 0, suave: true },
};

/** Open space claro com luzes desfocadas. A original é o dia; a noite foi derivada (ambiente escuro, só as lâmpadas acesas). */
export const COWORKING: Cena = {
  id: 'coworking',
  nome: 'Coworking',
  tipo: 'exterior',
  dia: `${base}cenas/coworking/dia.webp`,
  noite: `${base}cenas/coworking/noite.webp`,
  mascaras: `${base}cenas/coworking/mascaras.png`,
  proporcao: 1875 / 1050,
  luzes: [],
  alcance: { base: 0, fator: 0 },
  janelas: { colunas: 30, linhas: 17, subida: 0, suave: true },
};

export const CENAS = [ESCRITORIO, CIDADE, MARINA, EXPEDIENTE, COWORKING];
