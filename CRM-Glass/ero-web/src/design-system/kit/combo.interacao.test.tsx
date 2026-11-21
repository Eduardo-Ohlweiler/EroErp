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
