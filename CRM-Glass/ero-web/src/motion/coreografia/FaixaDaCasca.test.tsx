// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, useState, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import { AvisoContexto } from '../../design-system/ui/AvisoContexto';
import { faixa } from '../tokens';
import { FaixaDaCasca } from './FaixaDaCasca';
import { TrocaDeArea } from './TrocaDeArea';

/*
 * Faixa do superadmin (AvisoContexto dentro da FaixaDaCasca): entra depois da casca, sai antes dela,
 * e a área seguinte só monta depois que a faixa saiu. Reduzido: só esmaece, sem esperar.
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
/** O aviso de vidro (o motion.div dentro da região role=status). */
const aviso = () => document.querySelector<HTMLElement>('[data-faixa-casca] [role="status"] > div');
const opacidade = (e: HTMLElement | null) => (e ? Number(getComputedStyle(e).opacity || '1') : -1);

let trocar: (t: string) => void = () => {};
function Raiz() {
  const [tenant, setTenant] = useState('a');
  trocar = setTenant;
  return (
    <TrocaDeArea chave={`casca:${tenant}`} coreografia="contexto">
      <span data-area={tenant} />
      {tenant === 'a' && (
        <FaixaDaCasca>
          <AvisoContexto tipo="superadmin" acao={{ rotulo: 'Sair do contratante', onClick: () => {} }}>
            Você está dentro de <strong>Demo Solar</strong>
          </AvisoContexto>
        </FaixaDaCasca>
      )}
    </TrocaDeArea>
  );
}

describe('faixa da casca', () => {
  it('fica fora do fluxo (portal no body), não imprime e entra depois da casca', async () => {
    const c = montar(<Raiz />);
    const faixaEl = document.querySelector('[data-faixa-casca]')!;
    expect(c.contains(faixaEl)).toBe(false);
    expect(faixaEl.className).toContain('nao-imprime');
    await esperar(faixa.atraso * 0.5);
    expect(opacidade(aviso())).toBe(0);
    await esperar(faixa.atraso + 1);
    expect(opacidade(aviso())).toBe(1);
  });

  it('sai primeiro e a próxima área só monta depois que ela saiu', async () => {
    const c = montar(<Raiz />);
    await esperar(faixa.atraso + 1);
    act(() => trocar('b'));
    // saindo: a área antiga continua (com a faixa) e a nova ainda não montou
    expect(c.querySelector('[data-area="a"]')).not.toBeNull();
    expect(c.querySelector('[data-area="b"]')).toBeNull();
    expect(aviso()).not.toBeNull();
    await esperar(faixa.saida + 0.4);
    expect(aviso()).toBeNull();
    expect(c.querySelector('[data-area="a"]')).toBeNull();
    expect(c.querySelector('[data-area="b"]')).not.toBeNull();
  });

  it('movimento reduzido: só esmaece, sem esperar a casca', async () => {
    montar(
      <MotionConfig reducedMotion="always">
        <Raiz />
      </MotionConfig>,
    );
    await esperar(0.08);
    const o = opacidade(aviso());
    expect(o).toBeGreaterThan(0);
    const e = aviso()!;
    expect(e.style.transform === '' || e.style.transform === 'none').toBe(true);
  });
});
