// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, useState, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { motion, MotionConfig } from 'motion/react';
import { aba } from '../tokens';
import { Tela } from './Tela';
import { ConteudoDeAba } from './ConteudoDeAba';
import { DentroDoCartao, useVariantesDoPapel } from './papeis';
import { useBlocoDaTela } from './contexto';

/*
 * Troca de aba (TTabs → TTabPanel): a aba inicial nasce como parte da tela; a aba escolhida depois entra
 * sozinha como UM bloco curto (cartão sobe e aparece; os campos vêm com ele). Reduzido: só esmaece.
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let raiz: Root | null = null;
let caixa: HTMLDivElement | null = null;

function montar(el: ReactElement) {
  caixa = document.createElement('div');
  document.body.appendChild(caixa);
  raiz = createRoot(caixa);
  act(() => raiz!.render(el));
  return caixa;
}

afterEach(() => {
  act(() => raiz?.unmount());
  caixa?.remove();
  raiz = null;
  caixa = null;
});

const esperar = (s: number) => act(() => new Promise<void>((r) => setTimeout(r, s * 1000)));
const el = (c: HTMLElement, sel: string) => c.querySelector<HTMLElement>(sel)!;
const opacidade = (c: HTMLElement, sel: string) => Number(getComputedStyle(el(c, sel)).opacity || '1');

/** Cartão como o do TForm: papel `cartao`, campos dentro com DentroDoCartao. */
function Cartao({ id }: { id: string }) {
  return (
    <motion.div data-cartao={id} variants={useVariantesDoPapel('cartao')}>
      <DentroDoCartao>
        <Campo id={id} />
      </DentroDoCartao>
    </motion.div>
  );
}
function Campo({ id }: { id: string }) {
  return <motion.div data-campo={id} variants={useBlocoDaTela() ?? undefined} />;
}

/** Abas como o TTabs: só a aba ativa monta (Radix Tabs.Content). */
let escolher: (v: string) => void = () => {};
function Abas({ atraso = 0 }: { atraso?: number }) {
  const [atual, setAtual] = useState('dados');
  escolher = setAtual;
  return (
    <Tela coreografia="formulario" atraso={atraso}>
      <ConteudoDeAba key={atual}>
        <Cartao id={atual} />
      </ConteudoDeAba>
    </Tela>
  );
}

describe('conteúdo de aba', () => {
  it('a aba inicial faz parte da montagem da tela (espera o atraso dela, sem coreografia própria)', async () => {
    const c = montar(<Abas atraso={0.4} />);
    expect(c.querySelector('[data-coreografia="aba"]')).toBeNull();
    await esperar(0.15);
    expect(opacidade(c, '[data-cartao="dados"]')).toBe(0);
    await esperar(1.2);
    expect(opacidade(c, '[data-cartao="dados"]')).toBe(1);
  });

  it('a aba escolhida depois entra sozinha como um bloco curto; os campos vêm com o cartão', async () => {
    const c = montar(<Abas />);
    await esperar(1.2);
    act(() => escolher('sessoes'));
    expect(c.querySelector('[data-coreografia="aba"]')).not.toBeNull();
    await esperar(aba.entrada * 0.3);
    const meio = opacidade(c, '[data-cartao="sessoes"]');
    expect(meio).toBeGreaterThan(0);
    expect(meio).toBeLessThan(1);
    // os campos não têm cascata própria na troca de aba: aparecem junto com o cartão
    expect(opacidade(c, '[data-campo="sessoes"]')).toBe(1);
    await esperar(aba.entrada + 0.2);
    expect(opacidade(c, '[data-cartao="sessoes"]')).toBe(1);
  });

  it('movimento reduzido: a aba nova só esmaece, sem deslocamento', async () => {
    const c = montar(
      <MotionConfig reducedMotion="always">
        <Abas />
      </MotionConfig>,
    );
    await esperar(0.6);
    act(() => escolher('sessoes'));
    await esperar(0.05);
    const cartao = el(c, '[data-cartao="sessoes"]');
    expect(Number(getComputedStyle(cartao).opacity)).toBeLessThan(1);
    expect(cartao.style.transform === '' || cartao.style.transform === 'none').toBe(true);
    await esperar(0.4);
    expect(opacidade(c, '[data-cartao="sessoes"]')).toBe(1);
  });

  it('fora de uma <Tela> (catálogo, teste): anima por conta própria', async () => {
    const c = montar(
      <ConteudoDeAba>
        <Cartao id="solto" />
      </ConteudoDeAba>,
    );
    expect(c.querySelector('[data-coreografia="aba"]')).not.toBeNull();
    await esperar(aba.entrada + 0.2);
    expect(opacidade(c, '[data-cartao="solto"]')).toBe(1);
  });
});
