import { describe, expect, it } from 'vitest';
import { classificar, detectar, medirQuadros, type Ambiente } from './desempenho';
import { desempenho } from './tokens';

/*
 * Modo leve automático: a medição do ritmo de quadros com requestAnimationFrame simulado.
 * Cada teste dá a sequência de intervalos (ms) que a "tela" entrega.
 */

/** rAF simulado: cada pedido chega `proximo()` ms depois do anterior (num microtask, sem relógio real). */
function relogio(proximo: () => number) {
  let t = 1000;
  let pedidos = 0;
  const raf = (f: (t: number) => void) => {
    pedidos++;
    t += proximo();
    queueMicrotask(() => f(t));
    return pedidos;
  };
  return { raf, pedidos: () => pedidos };
}

/** Sequência que se repete: [16.7, 25] = alterna entre um e outro. */
const ciclo = (seq: number[]) => {
  let i = 0;
  return () => seq[i++ % seq.length];
};

function ambiente(proximo: () => number, extra: Partial<Ambiente> = {}) {
  const r = relogio(proximo);
  const amb: Ambiente = {
    raf: r.raf,
    oculta: () => false,
    visivel: () => Promise.resolve(),
    esperar: () => Promise.resolve(),
    aguardarParada: () => Promise.resolve(),
    ocupado: () => false,
    ...extra,
  };
  return { amb, pedidos: r.pedidos };
}

describe('classificar o ritmo de quadros', () => {
  it('aparelho rápido numa tela de 120 Hz: normal', () => {
    const m = classificar(Array(180).fill(1000 / 120));
    expect(m.modo).toBe('normal');
    expect(m.taxaTela).toBeCloseTo(120, 0);
  });

  it('tela de 60 Hz estável a 60 fps: normal (não é fraco só por ter 60 Hz)', () => {
    const m = classificar(Array(90).fill(1000 / 60));
    expect(m.modo).toBe('normal');
    expect(m.fps).toBeCloseTo(60, 0);
  });

  it('tela de 50 Hz estável: normal (o limite acompanha a taxa da tela)', () => {
    expect(classificar(Array(75).fill(20)).modo).toBe('normal');
  });

  it('o aparelho medido no F11 (46 fps numa tela de 120 Hz): leve', () => {
    // 120 Hz perdendo quadros: 2 ou 3 períodos de 8,33 ms entre quadros e, raramente, um no ritmo da tela.
    const iv = Array.from({ length: 69 }, (_, i) => (i % 20 === 0 ? 8.33 : i % 3 ? 25 : 16.67));
    const m = classificar(iv);
    expect(m.fps).toBeLessThan(desempenho.fpsMinimo);
    expect(m.modo).toBe('leve');
  });

  it('60 Hz a 30 fps cravados: leve (a taxa da tela nunca é suposta abaixo do mínimo)', () => {
    expect(classificar(Array(45).fill(1000 / 30)).modo).toBe('leve');
  });

  it('média boa, mas travadas frequentes acima de 33 ms: leve', () => {
    const iv = Array.from({ length: 100 }, (_, i) => (i % 5 === 0 ? 40 : 8.33));
    const m = classificar(iv);
    expect(m.fps).toBeGreaterThan(desempenho.fpsMinimo);
    expect(m.modo).toBe('leve');
  });

  it('uma travada isolada não derruba um aparelho bom', () => {
    const iv = Array.from({ length: 90 }, (_, i) => (i === 40 ? 120 : 1000 / 60));
    expect(classificar(iv).modo).toBe('normal');
  });
});

describe('detectar com requestAnimationFrame simulado', () => {
  it('rápido: normal', async () => {
    const { amb } = ambiente(() => 1000 / 120);
    const m = await detectar(amb);
    expect(m?.modo).toBe('normal');
    // a janela inteira foi medida (1,5 s a 120 Hz ≈ 180 quadros)
    expect(m?.quadros).toBeGreaterThanOrEqual(Math.floor(desempenho.janela * 120) - 1);
  });

  it('lento: leve', async () => {
    const { amb } = ambiente(ciclo([16.67, 25]));
    expect((await detectar(amb))?.modo).toBe('leve');
  });

  it('60 Hz estável: normal', async () => {
    const { amb } = ambiente(() => 1000 / 60);
    expect((await detectar(amb))?.modo).toBe('normal');
  });

  it('aba escondida não mede: espera ficar visível', async () => {
    let oculta = true;
    let mostrar: () => void = () => {};
    const { amb, pedidos } = ambiente(() => 1000 / 60, {
      oculta: () => oculta,
      visivel: () => new Promise<void>((r) => (mostrar = r)),
    });
    const resultado = detectar(amb);
    for (let i = 0; i < 20; i++) await Promise.resolve();
    expect(pedidos()).toBe(0);
    oculta = false;
    mostrar();
    expect((await resultado)?.modo).toBe('normal');
    expect(pedidos()).toBeGreaterThan(0);
  });

  it('a aba escondida no meio da janela descarta a medição', async () => {
    let n = 0;
    const amb = ambiente(() => 1000 / 60, { oculta: () => ++n > 30 }).amb;
    await expect(medirQuadros(amb)).resolves.toBeNull();
  });

  it('tela montando no meio da janela: descarta e mede de novo com a tela parada', async () => {
    let quadros = 0;
    let ocupadoAte = 20;
    let paradas = 0;
    const { amb } = ambiente(
      () => {
        quadros++;
        return 1000 / 60;
      },
      {
        ocupado: () => quadros > 5 && quadros < ocupadoAte,
        aguardarParada: () => {
          if (++paradas >= 2) ocupadoAte = 0; // depois da primeira tentativa, a tela fica parada
          return Promise.resolve();
        },
      },
    );
    const m = await detectar(amb);
    expect(m?.modo).toBe('normal');
    expect(paradas).toBeGreaterThanOrEqual(2);
  });

  it('uma pausa longa (depurador, aba congelada) não vira "aparelho lento"', async () => {
    let i = 0;
    const { amb } = ambiente(() => (++i === 10 ? 2000 : 1000 / 60));
    expect((await detectar(amb))?.modo).toBe('normal');
  });

  it('sempre interrompido: desiste (fica normal, sem resultado para guardar)', async () => {
    const { amb } = ambiente(() => 1000 / 60, { ocupado: () => true });
    await expect(detectar(amb)).resolves.toBeNull();
  });
});
