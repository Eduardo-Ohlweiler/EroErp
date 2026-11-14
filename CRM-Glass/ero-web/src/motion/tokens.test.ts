import { describe, expect, it } from 'vitest';
import { ambiente, atrasoDoBloco, coreografias, kit, montagem, orquestrar, variaveisDeMovimento, type Papel } from './tokens';

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

  it('a saída de uma tela comum não segura o usuário: cabe em 0,3 s (o protótipo saía em 0,22 s)', () => {
    for (const nome of ['inicio', 'padrao', 'formulario', 'etapa'] as const) {
      const { ritmo } = coreografias[nome];
      expect(ritmo.limiteSaida * ritmo.passoSaida + montagem.saida).toBeLessThanOrEqual(0.3);
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

describe('encaixe dos blocos do kit T*', () => {
  const PAPEIS: Papel[] = ['cartao', 'campo', 'rodape', 'grade', 'linhaGrade'];
  const valores = (v: unknown) => (typeof v === 'function' ? v(0, {}, {}) : v) as Record<string, unknown> & ComDelay;

  it('padrao e formulario definem todos os papéis', () => {
    for (const nome of ['padrao', 'formulario'] as const) {
      for (const p of PAPEIS) expect(coreografias[nome].variantes[p], `${nome}.${p}`).toBeDefined();
    }
  });

  it('cartão e grade encaixam como o bloco da tela e põem os de dentro em cascata', () => {
    for (const nome of ['padrao', 'formulario'] as const) {
      const v = coreografias[nome].variantes;
      for (const [papel, ritmo] of [
        ['cartao', kit.campos],
        ['grade', kit.linhas],
      ] as const) {
        const show = valores(v[papel].show);
        const bloco = valores(v.bloco.show);
        expect(show.opacity).toBe(bloco.opacity);
        const f = show.transition.delayChildren;
        expect(+f(0, 10).toFixed(3)).toBe(ritmo.inicio);
        expect(+f(1, 10).toFixed(3)).toBe(+(ritmo.inicio + ritmo.passo).toFixed(3));
        // depois do limite, o resto vem junto
        expect(f(ritmo.limite + 3, 20)).toBe(f(ritmo.limite, 20));
      }
    }
  });

  it('a cascata de dentro termina cedo: o último campo e a última linha animada começam em menos de 0,4 s', () => {
    for (const r of [kit.campos, kit.linhas]) expect(r.inicio + r.limite * r.passo).toBeLessThan(0.4);
    expect(kit.linhas.quantas).toBeLessThanOrEqual(kit.linhas.limite);
  });

  it('campos e linhas só animam opacidade e transform, e saem com o cartão (sem saída própria)', () => {
    for (const nome of ['padrao', 'formulario'] as const) {
      for (const p of ['campo', 'rodape', 'linhaGrade'] as const) {
        const v = coreografias[nome].variantes[p];
        expect(v.exit).toBeUndefined();
        for (const rotulo of ['hidden', 'show']) {
          const chaves = Object.keys(valores(v[rotulo])).filter((k) => k !== 'transition');
          expect(chaves.every((k) => ['opacity', 'x', 'y', 'scale'].includes(k)), `${nome}.${p}.${rotulo}`).toBe(true);
        }
      }
    }
  });
});

describe('variáveis --mov-* do CSS', () => {
  it('saem dos tokens, em segundos, e cobrem o fundo vivo', () => {
    const v = variaveisDeMovimento();
    expect(v['--mov-orb-1']).toBe(`${ambiente.orbs[0]}s`);
    expect(v['--mov-aurora']).toBe(`${ambiente.aurora}s`);
    expect(v['--mov-onda-2']).toBe(`${ambiente.ondas[1]}s`);
    expect(v['--mov-ease-ambiente']).toBe('cubic-bezier(0.42,0,0.58,1)');
    for (const [nome, valor] of Object.entries(v)) expect(valor, nome).toMatch(/^(\d+(\.\d+)?s|cubic-bezier\([\d.,-]+\))$/);
  });
});
