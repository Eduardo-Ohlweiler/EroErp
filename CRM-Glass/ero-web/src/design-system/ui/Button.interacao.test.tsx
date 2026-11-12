// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Button } from './Button';

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

describe('Button carregando (interação)', () => {
  it('não chama o onClick enquanto carrega e chama quando para', () => {
    const onClick = vi.fn();
    const c = montar(
      <Button carregando onClick={onClick}>
        Salvar
      </Button>,
    );
    act(() => c.querySelector('button')!.click());
    expect(onClick).not.toHaveBeenCalled();

    act(() =>
      raiz!.render(
        <Button carregando={false} onClick={onClick}>
          Salvar
        </Button>,
      ),
    );
    act(() => c.querySelector('button')!.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('barra o submit do formulário enquanto carrega', () => {
    const onSubmit = vi.fn((e: SubmitEvent) => e.preventDefault());
    const c = montar(
      <form>
        <Button type="submit" carregando>
          Entrar
        </Button>
      </form>,
    );
    c.querySelector('form')!.addEventListener('submit', onSubmit);
    act(() => c.querySelector('button')!.click());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('o foco fica no botão quando ele passa a carregar', () => {
    const c = montar(<Button carregando={false}>Salvar</Button>);
    const botao = c.querySelector('button')!;
    botao.focus();
    expect(document.activeElement).toBe(botao);
    act(() => raiz!.render(<Button carregando>Salvar</Button>));
    expect(document.activeElement).toBe(c.querySelector('button'));
    expect(botao.disabled).toBe(false);
    expect(botao.getAttribute('aria-disabled')).toBe('true');
  });
});
