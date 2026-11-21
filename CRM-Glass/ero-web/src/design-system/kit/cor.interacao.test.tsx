// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TCor } from './TCor';

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
  document.body.innerHTML = '';
});

/** O TCor com um botão fora do grupo, para o foco ter para onde sair. */
function cena(onBlur: () => void, onChange: (c: string) => void = () => {}) {
  const c = montar(
    <>
      <TCor label="Cor" value="" onChange={onChange} onBlur={onBlur} />
      <button type="button" data-fora>
        fora
      </button>
    </>,
  );
  const radios = [...c.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
  const fora = c.querySelector<HTMLButtonElement>('[data-fora]')!;
  const seletor = c.querySelector<HTMLInputElement>('input[type="color"]')!;
  return { radios, outra: radios[radios.length - 1], fora, seletor };
}

const umTique = () => act(() => new Promise<void>((r) => setTimeout(r, 0)));

describe('TCor: onBlur do grupo (interação)', () => {
  it('andar entre as opções (setas e foco) não toca o campo; sair do grupo toca uma vez', () => {
    const onBlur = vi.fn();
    const { radios, fora } = cena(onBlur);
    act(() => radios[0].focus());
    act(() => {
      radios[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(document.activeElement).toBe(radios[1]);
    act(() => radios[5].focus());
    expect(onBlur).not.toHaveBeenCalled();
    act(() => fora.focus());
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('com o seletor do sistema aberto, perder o foco não toca o campo; ao fechar com cor, grava e toca', async () => {
    const onBlur = vi.fn();
    const onChange = vi.fn();
    const { outra, seletor } = cena(onBlur, onChange);
    act(() => outra.focus());
    act(() => outra.click()); // abre o seletor
    act(() => outra.blur()); // o seletor do sistema tira o foco da página
    expect(onBlur).not.toHaveBeenCalled();
    act(() => {
      seletor.value = '#a1b2c3';
      seletor.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith('#A1B2C3');
    await umTique();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('seletor cancelado: o foco volta à opção sem tocar; depois sair toca', () => {
    const onBlur = vi.fn();
    const { outra, fora } = cena(onBlur);
    act(() => outra.focus());
    act(() => outra.click());
    act(() => outra.blur());
    act(() => outra.focus()); // fechou com Esc: o navegador devolve o foco
    expect(onBlur).not.toHaveBeenCalled();
    act(() => fora.focus());
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('seletor fechado clicando fora: o foco vai para fora e o campo é tocado', async () => {
    const onBlur = vi.fn();
    const { outra, fora } = cena(onBlur);
    act(() => outra.focus());
    act(() => outra.click());
    act(() => fora.focus());
    await umTique();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});

describe('TCor: o seletor do sistema grava só ao fechar (interação)', () => {
  it('arrastar (evento input) não grava; o change nativo grava em maiúsculas', () => {
    const onChange = vi.fn();
    const { outra, seletor } = cena(() => {}, onChange);
    act(() => outra.click());
    for (const v of ['#111111', '#222222', '#a1b2c3']) {
      act(() => {
        seletor.value = v;
        seletor.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
    expect(onChange).not.toHaveBeenCalled();
    act(() => {
      seletor.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('#A1B2C3');
  });

  it('o seletor acompanha o valor vindo de fora (não controlado pelo React)', () => {
    const c = montar(<TCor label="Cor" value="#a1b2c3" onChange={() => {}} />);
    const seletor = c.querySelector<HTMLInputElement>('input[type="color"]')!;
    expect(seletor.value).toBe('#a1b2c3');
    act(() => raiz!.render(<TCor label="Cor" value="#123456" onChange={() => {}} />));
    expect(seletor.value).toBe('#123456');
  });

  it('desabilitado: o change nativo não grava', () => {
    const onChange = vi.fn();
    const c = montar(<TCor label="Cor" value="" onChange={onChange} disabled />);
    const seletor = c.querySelector<HTMLInputElement>('input[type="color"]')!;
    act(() => {
      seletor.value = '#a1b2c3';
      seletor.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
