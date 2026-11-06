import { describe, expect, it } from 'vitest';
import { atrasoDoBloco, coreografias, montagem, orquestrar } from './tokens';

type ComDelay = { transition: { delayChildren: (i: number, n: number) => number; when?: string } };

describe('ritmo dos blocos', () => {
  it('entra de cima para baixo e, depois do limite, o resto vem junto', () => {
    const f = atrasoDoBloco('documento', 0.05, 3, 0.1);
    expect([0, 1, 2, 3, 4, 9].map((i) => +f(i, 10).toFixed(3))).toEqual([0.1, 0.15, 0.2, 0.25, 0.25, 0.25]);
  });

  it('sai de baixo para cima', () => {
    const f = atrasoDoBloco('reversa', 0.03, 8);
    expect(f(4, 5)).toBe(0);
    expect(+f(0, 5).toFixed(3)).toBe(0.12);
  });

  it('junto: todos no mesmo instante', () => {
    const f = atrasoDoBloco('junto', 0.05, 8, 0.2);
    expect(new Set([0, 3, 7].map((i) => f(i, 8)))).toEqual(new Set([0.2]));
  });

  it('tela só orquestra: sem valores próprios e saída depois dos filhos', () => {
    const v = orquestrar(montagem, { atraso: 0.3 });
    const show = v.show as unknown as ComDelay;
    const exit = v.exit as unknown as ComDelay;
    expect(Object.keys(v.show as object)).toEqual(['transition']);
    expect(+show.transition.delayChildren(0, 4).toFixed(3)).toBe(+(0.3 + montagem.inicio).toFixed(3));
    expect(exit.transition.when).toBe('afterChildren');
  });

  it('a tela inteira fica utilizável cedo: a última leva de blocos começa em menos de meio segundo', () => {
    for (const nome of ['inicio', 'padrao', 'formulario', 'contexto'] as const) {
      const { ritmo } = coreografias[nome];
      expect(ritmo.inicio + ritmo.limiteBlocos * ritmo.passo).toBeLessThan(0.5);
    }
  });

  it('nenhum bloco padrão anima filter (o vidro tem backdrop-filter)', () => {
    for (const c of Object.values(coreografias)) {
      for (const rotulo of ['hidden', 'show', 'exit']) {
        const alvo = c.variantes.bloco[rotulo];
        const valores = typeof alvo === 'function' ? alvo(0, {}, {}) : alvo;
        expect(valores).not.toHaveProperty('filter');
      }
    }
  });
});
