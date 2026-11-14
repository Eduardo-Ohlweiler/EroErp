// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { coreografiaDaTroca, useCoreografiaDaArea } from './area';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('coreografia da troca de área', () => {
  it('casca → casca de outro contratante é `contexto`; o resto é a padrão', () => {
    expect(coreografiaDaTroca('casca:plataforma', 'casca:t1')).toBe('contexto');
    expect(coreografiaDaTroca('casca:t1', 'casca:plataforma')).toBe('contexto');
    expect(coreografiaDaTroca('casca:t1', 'casca:t2')).toBe('contexto');
    expect(coreografiaDaTroca('login', 'casca:t1')).toBeUndefined();
    expect(coreografiaDaTroca('casca:t1', 'login')).toBeUndefined();
    expect(coreografiaDaTroca('casca:t1', 'casca:t1')).toBeUndefined();
    expect(coreografiaDaTroca(null, 'casca:t1')).toBeUndefined();
  });

  describe('useCoreografiaDaArea', () => {
    let raiz: Root | null = null;
    afterEach(() => {
      act(() => raiz?.unmount());
      raiz = null;
    });

    it('fica fixa até a próxima troca de chave', () => {
      const vistas: (string | undefined)[] = [];
      let mudar: (c: string) => void = () => {};
      let outroRender: () => void = () => {};
      function Sonda() {
        const [chave, setChave] = useState('login');
        const [, setN] = useState(0);
        mudar = setChave;
        outroRender = () => setN((n) => n + 1);
        vistas.push(useCoreografiaDaArea(chave));
        return null;
      }
      raiz = createRoot(document.createElement('div'));
      act(() => raiz!.render(<Sonda />));
      expect(vistas.at(-1)).toBeUndefined();
      act(() => mudar('casca:plataforma'));
      expect(vistas.at(-1)).toBeUndefined();
      act(() => mudar('casca:t1'));
      expect(vistas.at(-1)).toBe('contexto');
      act(() => outroRender()); // re-render sem troca: continua `contexto` (o atraso da área nova não muda)
      expect(vistas.at(-1)).toBe('contexto');
      act(() => mudar('login'));
      expect(vistas.at(-1)).toBeUndefined();
    });
  });
});
