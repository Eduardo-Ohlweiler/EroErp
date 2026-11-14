// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, useState, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { motion, MotionConfig } from 'motion/react';
import { kit } from '../tokens';
import { Tela } from './Tela';
import { DentroDoCartao, useVariantesDoPapel } from './papeis';
import { useBlocoDaTela } from './contexto';

/*
 * Encaixe dos blocos do kit: cartão → campos em cascata; grade → primeiras linhas em cascata, inclusive
 * quando as linhas chegam depois (consulta terminou com a tela já montada). Mede a opacidade no meio da cascata.
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
const opacidade = (c: HTMLElement, sel: string) => Number(getComputedStyle(c.querySelector(sel)!).opacity || '1');

/** Campo como o CampoForm: usa o bloco da tela em volta (dentro do cartão, o `campo`). */
function Campo({ n }: { n: number }) {
  return <motion.div data-campo={n} variants={useBlocoDaTela() ?? undefined} />;
}

function Cartao({ campos }: { campos: number }) {
  return (
    <motion.div data-cartao variants={useVariantesDoPapel('cartao')}>
      <DentroDoCartao>
        {Array.from({ length: campos }, (_, i) => (
          <Campo key={i} n={i} />
        ))}
      </DentroDoCartao>
    </motion.div>
  );
}

function Grade({ linhas }: { linhas: number }) {
  const linha = useVariantesDoPapel('linhaGrade');
  return (
    <motion.div data-grade variants={useVariantesDoPapel('grade')}>
      {Array.from({ length: linhas }, (_, i) => (
        <motion.div key={i} data-linha={i} variants={i < kit.linhas.quantas ? linha : undefined} />
      ))}
    </motion.div>
  );
}

describe('papéis do kit', () => {
  it('campos do cartão entram em cascata: o primeiro já aparece enquanto o último ainda espera', async () => {
    const c = montar(
      <Tela coreografia="formulario">
        <Cartao campos={10} />
      </Tela>,
    );
    // o último da cascata começa em inicio(tela) + inicio(campos) + limite × passo
    await esperar(kit.campos.inicio + kit.campos.passo * 2 + 0.06);
    expect(opacidade(c, '[data-campo="0"]')).toBeGreaterThan(0);
    expect(opacidade(c, '[data-campo="9"]')).toBe(0);
    await esperar(1.2);
    expect(opacidade(c, '[data-campo="9"]')).toBe(1);
  });

  it('linhas que chegam depois da montagem também entram em cascata', async () => {
    let carregar = () => {};
    function Lista() {
      const [n, setN] = useState(0);
      carregar = () => setN(12);
      return (
        <Tela coreografia="padrao">
          <Grade linhas={n} />
        </Tela>
      );
    }
    const c = montar(<Lista />);
    await esperar(1);
    act(() => carregar());
    await esperar(kit.linhas.inicio + kit.linhas.passo + 0.04);
    expect(opacidade(c, '[data-linha="0"]')).toBeGreaterThan(0);
    expect(opacidade(c, '[data-linha="7"]')).toBe(0);
    // além de `quantas`, aparecem junto com a grade (sem animação)
    expect(opacidade(c, '[data-linha="11"]')).toBe(1);
    await esperar(1);
    expect(opacidade(c, '[data-linha="7"]')).toBe(1);
  });

  it('movimento reduzido: sem cascata, todos esmaecem juntos', async () => {
    const c = montar(
      <MotionConfig reducedMotion="always">
        <Tela coreografia="formulario">
          <Cartao campos={10} />
        </Tela>
      </MotionConfig>,
    );
    await esperar(0.08);
    expect(opacidade(c, '[data-campo="9"]')).toBeGreaterThan(0);
    expect(opacidade(c, '[data-campo="9"]')).toBeCloseTo(opacidade(c, '[data-campo="0"]'), 1);
  });
});
