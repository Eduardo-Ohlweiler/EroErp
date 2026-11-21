// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TDBCombo } from './TDBCombo';
import { TCombo } from './TCombo';
import { SITUACAO_OPCOES } from './opcoes';

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

describe('TDBCombo com cor (interação)', () => {
  it('na lista, a bolinha antes do nome só nas opções com cor; escolher leva a bolinha ao campo fechado', async () => {
    const buscar = vi.fn(async () => [
      { id: 'f1', nome: 'Centro', cor: '#3b82f6' },
      { id: 'f2', nome: 'Antiga', cor: 'nada' },
      { id: 'f3', nome: 'Sem cor' },
    ]);
    let valor = '';
    const c = montar(<TDBCombo label="Filial" buscar={buscar} vazio="Todas" value="" onChange={(v) => (valor = v)} />);
    const input = c.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    expect(c.querySelector('[data-combobox-marca]')).toBeNull();
    await act(async () => {
      input.click();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    const opcoes = [...document.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(opcoes.map((o) => o.textContent)).toEqual(['Todas', 'Centro', 'Antiga', 'Sem cor']);
    const marca = (o: HTMLElement) => o.querySelector('[data-kit="TCorMarca"]');
    expect(opcoes.map((o) => !!marca(o))).toEqual([false, true, true, false]);
    expect(marca(opcoes[1])!.getAttribute('aria-hidden')).toBe('true');
    expect((marca(opcoes[1]) as HTMLElement).style.getPropertyValue('--cor-do-registro')).toBe('#3B82F6');
    expect((marca(opcoes[2]) as HTMLElement).style.getPropertyValue('--cor-do-registro')).toBe('var(--cor-registro-vazia)');
    // a bolinha vem antes do nome
    expect(opcoes[1].firstElementChild!.contains(marca(opcoes[1]))).toBe(true);
    await act(async () => {
      opcoes[1].click();
    });
    expect(valor).toBe('f1');
  });

  it('valor com cor no campo fechado; ao digitar a busca, a bolinha sai (o texto já não é a escolhida)', async () => {
    const buscar = vi.fn(async () => [{ id: 'f1', nome: 'Centro', cor: '#3b82f6' }]);
    const c = montar(<TDBCombo label="Filial" buscar={buscar} value="f1" rotuloInicial="Centro" corInicial="#3b82f6" onChange={() => {}} />);
    const input = c.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    expect(c.querySelector('[data-combobox-marca] [data-kit="TCorMarca"]')).not.toBeNull();
    await act(async () => {
      input.click();
    });
    expect(c.querySelector('[data-combobox-marca]')).not.toBeNull();
    await act(async () => {
      const definir = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      definir.call(input, 'Ce');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(c.querySelector('[data-combobox-marca]')).toBeNull();
  });
});

describe('autoFocus dos combos (interação)', () => {
  it('TDBCombo: foca o input ao montar, sem abrir a lista nem buscar no servidor', () => {
    const buscar = vi.fn(async () => [{ id: 'p1', nome: 'Ana' }]);
    const c = montar(<TDBCombo label="Pessoa" buscar={buscar} value="" onChange={() => {}} autoFocus />);
    const input = c.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(buscar).not.toHaveBeenCalled();
  });

  it('TCombo: foca o input ao montar, sem abrir a lista', () => {
    const c = montar(<TCombo label="Situação" opcoes={SITUACAO_OPCOES} value="true" onChange={() => {}} autoFocus />);
    const input = c.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('[role="listbox"]')).toBeNull();
  });
});
