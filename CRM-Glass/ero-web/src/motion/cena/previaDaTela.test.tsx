// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, useState, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AnimatePresence } from 'motion/react';
import { AparenciaProvider, useAparencia } from '../../shared/aparencia/AparenciaProvider';
import { cena, montagem } from '../tokens';
import { usePreviaDaTela } from './previaDaTela';
import { temaEmTroca, trocarTema } from './trocarTema';

/*
 * Ordem de saída da Aparência: a tela desmonta → limparPrevia → troca de tema em vídeo → a próxima tela monta
 * junto com o fim da revelação (cena.corteDaSaida), sem esperar o vídeo acabar.
 * A View Transition é simulada: `finished` só resolve quando o teste mandar (como o esmaecimento de 0,9 s).
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let raiz: Root | null = null;
let caixa: HTMLDivElement | null = null;
const terminarVideo: (() => void)[] = [];
const eventos: string[] = [];
let montouEm = 0;
let videoEm = 0;

function montar(el: ReactElement) {
  caixa = document.createElement('div');
  document.body.appendChild(caixa);
  raiz = createRoot(caixa);
  act(() => raiz!.render(el));
  return caixa;
}

/** O jsdom não tem View Transitions: o teste põe e tira um substituto. */
const doc = document as unknown as { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };

const html = document.documentElement as unknown as { animate?: () => unknown };
beforeEach(() => {
  eventos.length = 0;
  montouEm = 0;
  html.animate = () => ({}); // o jsdom não anima; a revelação só precisa existir
  doc.startViewTransition = (cb: () => void) => {
    cb();
    videoEm = performance.now();
    eventos.push(`video:${document.documentElement.dataset.theme}`);
    return { ready: Promise.resolve(), finished: new Promise<void>((r) => terminarVideo.push(r)) };
  };
});

afterEach(() => {
  act(() => raiz?.unmount());
  caixa?.remove();
  raiz = null;
  caixa = null;
  terminarVideo.splice(0).forEach((f) => f());
  delete doc.startViewTransition;
  delete html.animate;
});

const esperar = (s: number) => act(() => new Promise<void>((r) => setTimeout(r, s * 1000)));
/** Espera a condição (sem prazo fixo: o teste roda em paralelo com outros e o relógio varia). */
async function ate(cond: () => boolean, limite = 3) {
  const fim = performance.now() + limite * 1000;
  while (!cond() && performance.now() < fim) await esperar(0.01);
  expect(cond()).toBe(true);
}

function Aparencia() {
  usePreviaDaTela({ temaPadrao: 'CLARO', corDestaque: 'azul' });
  return <p data-tela="aparencia">Aparência</p>;
}

function Proxima() {
  const { settings, emPrevia } = useAparencia();
  if (!montouEm) montouEm = performance.now();
  eventos.push(`proxima:${settings.theme}:${settings.accent}:${emPrevia ? 'com-previa' : 'sem-previa'}`);
  return <p data-tela="proxima">Ficha</p>;
}

function App({ aoTrocar }: { aoTrocar: (f: () => void) => void }) {
  const [tela, setTela] = useState<'aparencia' | 'proxima'>('aparencia');
  aoTrocar(() => setTela('proxima'));
  return (
    <AparenciaProvider trocarTema={trocarTema}>
      <AnimatePresence mode="wait">{tela === 'aparencia' ? <Aparencia key="a" /> : <Proxima key="p" />}</AnimatePresence>
    </AparenciaProvider>
  );
}

describe('usePreviaDaTela: ordem de saída', () => {
  it('desmonta, limpa a prévia, começa a troca de tema e monta a próxima junto com o fim da revelação', async () => {
    let trocar = () => {};
    const c = montar(<App aoTrocar={(f) => (trocar = f)} />);

    // entrou: a prévia (claro) passa pela troca em vídeo
    await esperar(montagem.folgaTema * 2);
    expect(eventos).toEqual(['video:light']);
    await act(async () => terminarVideo.splice(0).forEach((f) => f()));
    expect(document.documentElement.dataset.theme).toBe('light');

    // sai
    eventos.length = 0;
    const clique = performance.now();
    act(() => trocar());
    // a prévia saiu e a revelação de volta ao escuro começou; a próxima tela ainda espera o ponto de corte
    await ate(() => eventos.includes('video:dark'));
    expect(c.querySelector('[data-tela="proxima"]')).toBeNull();

    // ponto de corte: a próxima monta com a revelação ainda rodando (o vídeo NÃO terminou)
    await ate(() => !!c.querySelector('[data-tela="proxima"]'));
    expect(montouEm - videoEm).toBeGreaterThanOrEqual(cena.revelacao.duracao * cena.corteDaSaida * 1000 - 20);
    expect(temaEmTroca()).toBe(true);
    expect(terminarVideo).toHaveLength(1);
    expect(c.querySelector('[data-tela="aparencia"]')).toBeNull();
    // e já nasce sem prévia e no tema de antes: nada vaza
    expect(eventos[1]).toBe('proxima:dark:violeta:sem-previa');
    expect(eventos.every((e) => !e.includes('com-previa'))).toBe(true);
    console.info(`saída da Aparência (jsdom): clique → próxima tela em ${(montouEm - clique).toFixed(0)} ms, vídeo → próxima em ${(montouEm - videoEm).toFixed(0)} ms`);

    // o vídeo termina depois, sem remontar nada
    await act(async () => terminarVideo.splice(0).forEach((f) => f()));
    expect(temaEmTroca()).toBe(false);
    expect(c.querySelector('[data-tela="proxima"]')).not.toBeNull();
  });

  it('desmontada sem AnimatePresence, a prévia também não fica', async () => {
    function Pai({ mostrar }: { mostrar: boolean }) {
      return mostrar ? <Aparencia /> : <Proxima />;
    }
    let definir = (_: boolean) => {};
    function Raiz() {
      const [m, setM] = useState(true);
      definir = setM;
      return (
        <AparenciaProvider>
          <Pai mostrar={m} />
        </AparenciaProvider>
      );
    }
    montar(<Raiz />);
    eventos.length = 0;
    act(() => definir(false));
    // sem AnimatePresence não há ordem: o cleanup limpa assim que a tela desmonta
    expect(eventos.at(-1)).toBe('proxima:dark:violeta:sem-previa');
  });
});
