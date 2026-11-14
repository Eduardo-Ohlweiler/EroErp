import { useSyncExternalStore } from 'react';
import { desempenho as limites } from './tokens';
import { aguardarTelaParada, telaEmMovimento } from './coreografia/andamento';

/*
 * Modo leve. Em aparelho fraco (GPU integrada redesenhando a tela cheia: vidro + fundo vivo):
 *  - o fundo vivo para (LiveBackground, SceneBackground, ParticleSphere ficam num quadro parado);
 *  - a revelação circular e a sequência da cena viram um esmaecimento (trocarTema.ts).
 * O movimento reduzido continua mandando como antes; o modo leve não liga nada a mais.
 *
 * QUEM É MEDIDO: ninguém, por padrão. O visual completo vale para todos. Só quando o contratante tem
 * `desempenhoAutomatico` ligado (o superadmin ativa "otimizar desempenho em computadores mais fracos") o app mede o
 * aparelho dos usuários dele e liga o modo leve se for fraco. Plataforma e login (sem contratante): completo, sem
 * medir. A flag chega pelo AparenciaProvider (useAparencia().desempenhoAutomatico) e o LiveBackground a repassa
 * para cá (configurarDeteccao).
 *
 * Como mede: alguns segundos depois que o fundo animado passou a valer, com a tela parada (sem montagem nem troca
 * de tema) e a aba visível, conta o ritmo de requestAnimationFrame por `desempenho.janela` s. A taxa da tela sai do
 * melhor intervalo observado, então uma tela de 60 Hz a 60 fps é normal. O resultado fica no sessionStorage
 * (valendo `desempenho.validade` s) para não medir a cada carga.
 *
 * Contrato com o design system: <html data-desempenho="leve|normal">. O index.css usa
 * html[data-desempenho='leve'] para parar as animações CSS do fundo (orbs, aurora, ondas).
 *
 * COMO FORÇAR (QA, dono testando no próprio notebook, que é o aparelho fraco):
 *  - ?desempenho=normal → sempre completo (fundo vivo, revelação circular, cena em vídeo), sem detecção;
 *  - ?desempenho=leve   → sempre leve, sem detecção;
 *  - ?desempenho=auto   → volta ao automático (apaga o valor fixo).
 * O valor fixo fica no localStorage deste navegador (`ero.desempenho.fixo`), vale em toda carga até o `auto` e
 * vence a flag do contratante. O mesmo controle está no catálogo (/design-system, só em dev): Automático ·
 * Sempre completo · Sempre leve, com o que a detecção mediu e se o contratante atual pediu a detecção.
 */

export type ModoDesempenho = 'normal' | 'leve';

/** O que a medição viu. `taxaTela` é estimada pelo melhor intervalo entre quadros (Hz). */
export type Medicao = {
  modo: ModoDesempenho;
  fps: number;
  taxaTela: number;
  limiar: number;
  /** fração de quadros acima de `desempenho.quadroLento` ms */
  lentos: number;
  quadros: number;
};

type Limites = typeof limites;

const CHAVE = 'ero.desempenho';
const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Classifica uma janela de intervalos entre quadros (ms). Puro, para o teste.
 * Leve quando a média fica abaixo de min(fpsMinimo, taxa da tela × fracaoDaTela) ou quando quadros lentos
 * passam de `fracaoLentos`.
 */
export function classificar(intervalos: number[], l: Limites = limites): Medicao {
  const iv = intervalos.filter((x) => x > 0);
  const n = iv.length;
  if (!n) return { modo: 'normal', fps: 0, taxaTela: 0, limiar: 0, lentos: 0, quadros: 0 };
  const total = iv.reduce((a, b) => a + b, 0);
  const fps = (1000 * n) / total;
  // Melhor intervalo: um percentil baixo, não o mínimo (dois rAF colados depois de uma travada não são a tela).
  const ordenados = [...iv].sort((a, b) => a - b);
  const melhor = ordenados[Math.floor(n * 0.05)];
  const taxaTela = Math.min(240, Math.max(l.taxaMinimaTela, 1000 / melhor));
  const limiar = Math.min(l.fpsMinimo, taxaTela * l.fracaoDaTela);
  const lentos = iv.filter((x) => x > l.quadroLento).length / n;
  const modo: ModoDesempenho = fps < limiar || lentos > l.fracaoLentos ? 'leve' : 'normal';
  return { modo, fps: r1(fps), taxaTela: r1(taxaTela), limiar: r1(limiar), lentos: Math.round(lentos * 100) / 100, quadros: n };
}

/** O que a detecção usa do navegador (o teste troca por um relógio simulado). */
export type Ambiente = {
  raf: (f: (t: number) => void) => unknown;
  oculta: () => boolean;
  /** Resolve quando a aba ficar visível. */
  visivel: () => Promise<void>;
  esperar: (s: number) => Promise<void>;
  /** Resolve quando nenhuma tela estiver montando ou desmontando. */
  aguardarParada: () => Promise<void>;
  /** true se algo além do repouso está acontecendo (tela montando, troca de tema): a janela é descartada. */
  ocupado: () => boolean;
};

/**
 * Conta os intervalos entre quadros por `janela` s. Devolve null se a medição foi interrompida
 * (aba escondida, tela montando, troca de tema, uma pausa longa demais para ser desenho).
 */
export function medirQuadros(amb: Pick<Ambiente, 'raf' | 'oculta' | 'ocupado'>, l: Limites = limites) {
  return new Promise<number[] | null>((resolve) => {
    const iv: number[] = [];
    let anterior = -1;
    let inicio = -1;
    const quadro = (t: number) => {
      if (amb.oculta() || amb.ocupado()) return resolve(null);
      if (anterior >= 0) {
        const d = t - anterior;
        if (d > l.pausa * 1000) return resolve(null);
        iv.push(d);
      } else inicio = t;
      anterior = t;
      if (t - inicio >= l.janela * 1000) return resolve(iv);
      amb.raf(quadro);
    };
    amb.raf(quadro);
  });
}

/**
 * Espera o momento certo e mede. Aba escondida não mede: espera ficar visível. Devolve null se todas as
 * `tentativas` foram interrompidas (o app fica no modo normal e a próxima carga tenta de novo).
 */
export async function detectar(amb: Ambiente, l: Limites = limites): Promise<Medicao | null> {
  await amb.esperar(l.atraso);
  let falhas = 0;
  while (falhas < l.tentativas) {
    if (amb.oculta()) {
      await amb.visivel();
      await amb.esperar(l.atrasoAoVoltar);
      continue;
    }
    await amb.aguardarParada();
    if (amb.oculta()) continue;
    const iv = await medirQuadros(amb, l);
    if (iv && iv.length) return classificar(iv, l);
    falhas++;
  }
  return null;
}

/* ---------------- Estado (um por página) ---------------- */

/** O que a pessoa escolheu para este navegador: automático (regra do contratante) ou um modo fixo. */
export type PreferenciaDesempenho = 'auto' | ModoDesempenho;

/** Fotografia do estado, para o hook (mesma referência enquanto nada muda). */
export type EstadoDesempenho = {
  /** modo em vigor agora */
  modo: ModoDesempenho;
  preferencia: PreferenciaDesempenho;
  /** o contratante atual pediu a detecção (`desempenhoAutomatico`) */
  contratantePediu: boolean;
  /** última medição válida desta sessão do navegador (null: ainda não mediu) */
  medicao: (Medicao & { em: number }) | null;
  /** medindo agora (o fundo fica completo durante a janela) */
  medindo: boolean;
};

const CHAVE_FIXO = 'ero.desempenho.fixo';

function lerParametroDaUrl(): PreferenciaDesempenho | null {
  try {
    const v = new URLSearchParams(window.location.search).get('desempenho');
    return v === 'leve' || v === 'normal' || v === 'auto' ? v : null;
  } catch {
    return null;
  }
}

function lerFixo(): ModoDesempenho | null {
  try {
    const v = window.localStorage.getItem(CHAVE_FIXO);
    return v === 'leve' || v === 'normal' ? v : null;
  } catch {
    return null;
  }
}

function gravarFixo(p: PreferenciaDesempenho) {
  try {
    if (p === 'auto') window.localStorage.removeItem(CHAVE_FIXO);
    else window.localStorage.setItem(CHAVE_FIXO, p);
  } catch {
    /* localStorage indisponível: vale só nesta carga */
  }
}

function lerSessao(agora = Date.now(), l: Limites = limites): EstadoDesempenho['medicao'] {
  try {
    const s = JSON.parse(window.sessionStorage.getItem(CHAVE) ?? 'null') as (Medicao & { em: number }) | null;
    if (!s || (s.modo !== 'leve' && s.modo !== 'normal') || typeof s.em !== 'number') return null;
    if (!(agora - s.em >= 0 && agora - s.em < l.validade * 1000)) return null;
    return s;
  } catch {
    return null;
  }
}

function salvarSessao(m: Medicao) {
  const salvo = { ...m, em: Date.now() };
  try {
    window.sessionStorage.setItem(CHAVE, JSON.stringify(salvo));
  } catch {
    /* sessionStorage indisponível (modo privado restrito): mede de novo na próxima carga */
  }
  return salvo;
}

const temJanela = typeof window !== 'undefined' && typeof document !== 'undefined';

let preferencia: PreferenciaDesempenho = 'auto';
let medicao: EstadoDesempenho['medicao'] = null;
let medindo = false;
/** Flag do contratante e fundo animado, repassados pelo LiveBackground (configurarDeteccao). */
let contratantePediu = false;
let fundoAnimado = false;
if (temJanela) {
  // ?desempenho= na URL fixa (ou solta, com auto) e fica no localStorage até o próximo auto.
  const daUrl = lerParametroDaUrl();
  if (daUrl) gravarFixo(daUrl);
  preferencia = daUrl === 'auto' ? 'auto' : (daUrl ?? lerFixo() ?? 'auto');
  medicao = lerSessao();
}

/**
 * Modo em vigor. Fixo (URL ou seletor) vence tudo. No automático, só um contratante que pediu a detecção usa
 * a medição; sem o pedido (padrão, plataforma, login), completo.
 */
function calcular(): EstadoDesempenho {
  let modo: ModoDesempenho = 'normal';
  if (medindo) modo = 'normal';
  else if (preferencia !== 'auto') modo = preferencia;
  else if (contratantePediu && medicao) modo = medicao.modo;
  return { modo, preferencia, contratantePediu, medicao, medindo };
}

let estado = calcular();
marcarHtml();

const ouvintes = new Set<() => void>();

function marcarHtml() {
  if (temJanela) document.documentElement.dataset.desempenho = estado.modo;
}

function atualizar() {
  const n = calcular();
  const e = estado;
  if (n.modo === e.modo && n.preferencia === e.preferencia && n.contratantePediu === e.contratantePediu && n.medicao === e.medicao && n.medindo === e.medindo)
    return;
  estado = n;
  marcarHtml();
  ouvintes.forEach((f) => f());
}

function assinar(f: () => void) {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
}

/** Fixa o modo só nesta página, sem gravar nada (testes). */
export function definirModoDesempenho(novo: ModoDesempenho) {
  preferencia = novo;
  atualizar();
}

/**
 * Fixa o modo neste navegador (localStorage), como o ?desempenho= da URL. `auto` volta à regra do contratante:
 * se ele pediu a detecção, usa a medição desta sessão ou mede.
 */
export function fixarDesempenho(p: PreferenciaDesempenho) {
  gravarFixo(p);
  preferencia = p;
  atualizar();
  talvezMedir();
}

/** true no modo leve. Leitura direta, para quem não é componente (trocarTema, SceneBackground no meio do roteiro). */
export function modoLeve() {
  return estado.modo === 'leve';
}

/** Modo leve AO VIVO: o componente re-renderiza quando a detecção termina, o modo é fixado ou o contratante muda. */
export function useModoLeve() {
  return useSyncExternalStore(assinar, modoLeve, () => false);
}

/**
 * Estado completo, ao vivo (seletor do catálogo): modo em vigor, preferência, pedido do contratante, última medição.
 * Para forçar: ?desempenho=normal | leve | auto na URL, ou fixarDesempenho() (seletor do /design-system).
 */
export function useDesempenho() {
  return useSyncExternalStore(
    assinar,
    () => estado,
    () => estado,
  );
}

/* ---------------- Detecção ---------------- */

/** O que mais descarta a janela (a troca de tema em andamento), recebido do LiveBackground. */
let ocupadoExtra: () => boolean = () => false;
/** Ambiente de medição (o teste troca por um relógio simulado). */
let ambiente: Ambiente | null = null;
let rodando: Promise<void> | null = null;
/** A detecção automática roda no máximo uma vez por carga (o resultado fica na sessão). */
let jaTentou = false;

function ambienteReal(): Ambiente {
  return {
    raf: (f) => requestAnimationFrame(f),
    oculta: () => document.hidden,
    visivel: () =>
      new Promise<void>((resolve) => {
        const f = () => {
          if (document.hidden) return;
          document.removeEventListener('visibilitychange', f);
          resolve();
        };
        document.addEventListener('visibilitychange', f);
        f();
      }),
    esperar: (s) => new Promise<void>((r) => setTimeout(r, s * 1000)),
    aguardarParada: () => aguardarTelaParada(),
    ocupado: () => telaEmMovimento() || ocupadoExtra(),
  };
}

function rodarDeteccao(l: Limites = limites) {
  if (rodando) return rodando;
  const amb = ambiente ?? ambienteReal();
  rodando = detectar(amb, l)
    .then((m) => {
      if (m) medicao = salvarSessao(m);
    })
    .finally(() => {
      rodando = null;
      medindo = false;
      atualizar();
    });
  return rodando;
}

/** Mede se tudo pede: automático, contratante pediu, fundo animado, sem medição válida e ainda não tentou. */
function talvezMedir() {
  if (!temJanela || jaTentou || rodando) return;
  if (preferencia !== 'auto' || !contratantePediu || !fundoAnimado || medicao) return;
  jaTentou = true;
  void rodarDeteccao();
}

/**
 * Liga a detecção à regra do contratante. Chamado pelo LiveBackground a cada mudança:
 *  - `contratante`: `desempenhoAutomatico` do contratante atual (false no padrão, na plataforma e no login);
 *  - `fundoAnimado`: com o fundo parado (desligado na Aparência, movimento reduzido) a medição não diria nada;
 *  - `ocupado`: o que mais descarta a janela medida (a troca de tema em andamento);
 *  - `ambiente`: só nos testes (requestAnimationFrame simulado).
 * Mede no máximo uma vez por carga, e nunca com modo fixo (URL ou seletor) ou medição válida na sessão.
 */
export function configurarDeteccao(opcoes: { contratante: boolean; fundoAnimado: boolean; ocupado?: () => boolean; ambiente?: Ambiente }) {
  contratantePediu = opcoes.contratante;
  fundoAnimado = opcoes.fundoAnimado;
  if (opcoes.ocupado) ocupadoExtra = opcoes.ocupado;
  if (opcoes.ambiente) ambiente = opcoes.ambiente;
  atualizar();
  talvezMedir();
  return rodando;
}

/**
 * Mede de novo agora (seletor do catálogo), mesmo sem o pedido do contratante. Durante a janela o fundo fica
 * completo (com o modo leve, mediria o fundo parado e acharia o aparelho rápido). O resultado só passa a valer
 * no automático com o contratante pedindo; nos outros casos fica anotado.
 */
export function medirDesempenhoAgora() {
  if (rodando || !temJanela) return rodando;
  medindo = true;
  atualizar();
  return rodarDeteccao({ ...limites, atraso: limites.atrasoAoVoltar });
}
