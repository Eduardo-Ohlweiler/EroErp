// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AparenciaProvider, useAparencia, type AparenciaCtx } from './AparenciaProvider';
import { combinarCamadas, temaSemPrevia } from './camadas';
import { PADRAO_SISTEMA } from './mapear';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/*
 * Precedência da aparência: sistema → contratante → tema do usuário (só o tema) → prévia.
 * O tema do usuário (`temaPreferido`) vence o `temaPadrao` do contratante; a prévia (tela Aparência) vence o
 * usuário; `null` segue o contratante. O resto da aparência continua sendo só do contratante.
 */

const contratanteClaro = { theme: 'light' as const, accent: 'azul' as const, fundo: 'marina' as const };

describe('combinarCamadas', () => {
  it('sem nada vale o padrão do sistema (login)', () => {
    expect(combinarCamadas({ contratante: null, temaDoUsuario: null, previa: null })).toEqual(PADRAO_SISTEMA);
  });

  it('o tema do usuário vence o do contratante e não mexe no resto', () => {
    const s = combinarCamadas({ contratante: contratanteClaro, temaDoUsuario: 'dark', previa: null });
    expect(s.theme).toBe('dark');
    expect(s.accent).toBe('azul');
    expect(s.fundo).toBe('marina');
  });

  it('usuário sem preferência (null) segue o contratante', () => {
    expect(combinarCamadas({ contratante: contratanteClaro, temaDoUsuario: null, previa: null }).theme).toBe('light');
  });

  it('a prévia vence o tema do usuário', () => {
    const s = combinarCamadas({ contratante: { theme: 'dark' }, temaDoUsuario: 'dark', previa: { theme: 'light' } });
    expect(s.theme).toBe('light');
  });

  it('prévia sem tema deixa o do usuário', () => {
    const s = combinarCamadas({ contratante: contratanteClaro, temaDoUsuario: 'dark', previa: { accent: 'rosa' } });
    expect(s.theme).toBe('dark');
    expect(s.accent).toBe('rosa');
  });

  it('o usuário escolhe tema na plataforma (sem contratante)', () => {
    expect(combinarCamadas({ contratante: null, temaDoUsuario: 'light', previa: null }).theme).toBe('light');
  });

  it('temaSemPrevia: usuário, senão contratante, senão sistema', () => {
    expect(temaSemPrevia({ contratante: contratanteClaro, temaDoUsuario: 'dark' })).toBe('dark');
    expect(temaSemPrevia({ contratante: contratanteClaro, temaDoUsuario: null })).toBe('light');
    expect(temaSemPrevia({ contratante: null, temaDoUsuario: null })).toBe(PADRAO_SISTEMA.theme);
  });
});

describe('AparenciaProvider com o tema do usuário', () => {
  let raiz: Root | null = null;
  afterEach(() => {
    act(() => raiz?.unmount());
    raiz = null;
    delete document.documentElement.dataset.theme;
  });

  function montar() {
    const ref: { atual: AparenciaCtx | null } = { atual: null };
    function Espia() {
      ref.atual = useAparencia();
      return null;
    }
    const caixa = document.createElement('div');
    document.body.appendChild(caixa);
    raiz = createRoot(caixa);
    act(() =>
      raiz!.render(
        <AparenciaProvider>
          <Espia />
        </AparenciaProvider>,
      ),
    );
    const ctx = () => ref.atual!;
    const tema = () => document.documentElement.dataset.theme;
    return { ctx, tema };
  }

  it('usuário vence o contratante, a prévia vence o usuário e, ao sair dela, volta o usuário', () => {
    const { ctx, tema } = montar();
    expect(tema()).toBe('dark');

    act(() => ctx().definirContratante({ temaPadrao: 'CLARO', corDestaque: 'azul' }));
    expect(tema()).toBe('light');

    act(() => ctx().definirTemaDoUsuario('ESCURO'));
    expect(tema()).toBe('dark');
    expect(ctx().temaBase).toBe('dark');
    expect(ctx().settings.accent).toBe('azul');

    // Tela Aparência: mostra o tema configurado do contratante (o que o cliente verá)
    act(() => ctx().definirPrevia({ temaPadrao: 'CLARO', corDestaque: 'rosa' }));
    expect(tema()).toBe('light');
    expect(ctx().temaBase).toBe('dark'); // a escolha do usuário continua a mesma

    act(() => ctx().limparPrevia());
    expect(tema()).toBe('dark');
  });

  it('null (ou valor desconhecido) segue o contratante', () => {
    const { ctx, tema } = montar();
    act(() => {
      ctx().definirContratante({ temaPadrao: 'CLARO' });
      ctx().definirTemaDoUsuario('ESCURO');
    });
    expect(tema()).toBe('dark');

    act(() => ctx().definirTemaDoUsuario(null));
    expect(tema()).toBe('light');

    act(() => ctx().definirTemaDoUsuario('dark'));
    expect(tema()).toBe('light');
  });

  it('sem sessão (login) fica o padrão do sistema', () => {
    const { ctx, tema } = montar();
    act(() => {
      ctx().definirContratante({ temaPadrao: 'CLARO' });
      ctx().definirTemaDoUsuario('CLARO');
    });
    expect(tema()).toBe('light');
    act(() => {
      ctx().definirContratante(null);
      ctx().definirTemaDoUsuario(null);
    });
    expect(tema()).toBe(PADRAO_SISTEMA.theme);
  });
});
