// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Ambiente } from './desempenho';

/*
 * Regra do modo leve (decisão do dono): ninguém é medido por padrão. Só o contratante com `desempenhoAutomatico`
 * tem o aparelho medido; o modo fixado na URL ou no seletor (localStorage) vence a flag.
 * Cada teste carrega o módulo do zero (o estado é um por página).
 */

/** Ambiente com rAF simulado: cada quadro chega `ms` depois do anterior. Conta os pedidos de quadro. */
function ambiente(ms: number) {
  let t = 0;
  const conta = { quadros: 0 };
  const amb: Ambiente = {
    raf: (f) => {
      conta.quadros++;
      t += ms;
      queueMicrotask(() => f(t));
      return conta.quadros;
    },
    oculta: () => false,
    visivel: () => Promise.resolve(),
    esperar: () => Promise.resolve(),
    aguardarParada: () => Promise.resolve(),
    ocupado: () => false,
  };
  return { amb, conta };
}

const LENTO = 1000 / 40;

async function carregar(url = '/') {
  window.history.replaceState(null, '', url);
  vi.resetModules();
  return import('./desempenho');
}

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('quem é medido', () => {
  it('flag do contratante desligada: não mede e fica completo', async () => {
    const d = await carregar();
    const { amb, conta } = ambiente(LENTO);
    await d.configurarDeteccao({ contratante: false, fundoAnimado: true, ambiente: amb });
    await Promise.resolve();
    expect(conta.quadros).toBe(0);
    expect(d.modoLeve()).toBe(false);
    expect(document.documentElement.dataset.desempenho).toBe('normal');
  });

  it('contratante pediu a detecção: mede e liga o modo leve no aparelho fraco', async () => {
    const d = await carregar();
    const { amb, conta } = ambiente(LENTO);
    await d.configurarDeteccao({ contratante: true, fundoAnimado: true, ambiente: amb });
    expect(conta.quadros).toBeGreaterThan(0);
    expect(d.modoLeve()).toBe(true);
    expect(document.documentElement.dataset.desempenho).toBe('leve');
    expect(JSON.parse(window.sessionStorage.getItem('ero.desempenho')!).modo).toBe('leve');
  });

  it('com o fundo parado não mede, mesmo com o pedido do contratante', async () => {
    const d = await carregar();
    const { amb, conta } = ambiente(LENTO);
    await d.configurarDeteccao({ contratante: true, fundoAnimado: false, ambiente: amb });
    expect(conta.quadros).toBe(0);
    expect(d.modoLeve()).toBe(false);
  });

  it('saiu do contratante (login, plataforma): volta ao completo, a medição fica guardada', async () => {
    const d = await carregar();
    const { amb } = ambiente(LENTO);
    await d.configurarDeteccao({ contratante: true, fundoAnimado: true, ambiente: amb });
    expect(d.modoLeve()).toBe(true);
    await d.configurarDeteccao({ contratante: false, fundoAnimado: true });
    expect(d.modoLeve()).toBe(false);
  });

  it('medição válida na sessão: não mede de novo ao recarregar', async () => {
    let d = await carregar();
    await d.configurarDeteccao({ contratante: true, fundoAnimado: true, ambiente: ambiente(LENTO).amb });
    d = await carregar();
    const { amb, conta } = ambiente(1000 / 120);
    await d.configurarDeteccao({ contratante: true, fundoAnimado: true, ambiente: amb });
    expect(conta.quadros).toBe(0);
    expect(d.modoLeve()).toBe(true);
  });
});

describe('modo fixado para teste (vence a flag do contratante)', () => {
  it('?desempenho=normal fica no localStorage e não mede, mesmo com o pedido do contratante', async () => {
    let d = await carregar('/?desempenho=normal');
    const { amb, conta } = ambiente(LENTO);
    await d.configurarDeteccao({ contratante: true, fundoAnimado: true, ambiente: amb });
    expect(conta.quadros).toBe(0);
    expect(d.modoLeve()).toBe(false);
    expect(window.localStorage.getItem('ero.desempenho.fixo')).toBe('normal');
    // outra carga, sem o parâmetro: continua fixo
    d = await carregar('/');
    await d.configurarDeteccao({ contratante: true, fundoAnimado: true, ambiente: amb });
    expect(conta.quadros).toBe(0);
    expect(d.useDesempenho).toBeTypeOf('function');
  });

  it('?desempenho=leve liga o modo leve sem contratante e sem medir', async () => {
    const d = await carregar('/?desempenho=leve');
    const { amb, conta } = ambiente(1000 / 120);
    await d.configurarDeteccao({ contratante: false, fundoAnimado: true, ambiente: amb });
    expect(conta.quadros).toBe(0);
    expect(d.modoLeve()).toBe(true);
    expect(document.documentElement.dataset.desempenho).toBe('leve');
  });

  it('?desempenho=auto apaga o valor fixo e volta à regra do contratante', async () => {
    window.localStorage.setItem('ero.desempenho.fixo', 'leve');
    const d = await carregar('/?desempenho=auto');
    expect(window.localStorage.getItem('ero.desempenho.fixo')).toBeNull();
    expect(d.modoLeve()).toBe(false);
  });

  it('seletor do catálogo: fixa e solta sem recarregar', async () => {
    const d = await carregar();
    d.fixarDesempenho('leve');
    expect(d.modoLeve()).toBe(true);
    expect(window.localStorage.getItem('ero.desempenho.fixo')).toBe('leve');
    // de volta ao automático com o contratante pedindo: mede agora
    const { amb, conta } = ambiente(1000 / 60);
    await d.configurarDeteccao({ contratante: true, fundoAnimado: true, ambiente: amb });
    expect(conta.quadros).toBe(0); // fixo: não mede
    d.fixarDesempenho('auto');
    await Promise.resolve();
    await d.medirDesempenhoAgora();
    expect(conta.quadros).toBeGreaterThan(0);
    expect(d.modoLeve()).toBe(false);
    expect(window.localStorage.getItem('ero.desempenho.fixo')).toBeNull();
  });
});
