// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Theme } from '../../shared/aparencia/AparenciaProvider';
import { definirModoDesempenho } from '../desempenho';
import { registrarCena } from './sceneSync';
import { trocarTema } from './trocarTema';

/*
 * Qual vídeo a troca de tema escolhe: revelação circular (normal), esmaecimento (modo leve) ou troca direta
 * (movimento reduzido, que continua mandando). O jsdom não tem View Transitions: o teste põe um substituto e
 * anota o que foi animado no <html>.
 */

type Quadros = Record<string, unknown[]>;
const animacoes: { quadros: Quadros; pseudo?: string }[] = [];
let transicoes = 0;
let classesNaCaptura = '';

const doc = document as unknown as { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
const html = document.documentElement as unknown as { animate?: (q: Quadros, o: { pseudoElement?: string }) => unknown };

beforeEach(() => {
  animacoes.length = 0;
  transicoes = 0;
  html.animate = (quadros, opcoes) => {
    animacoes.push({ quadros, pseudo: opcoes.pseudoElement });
    return {};
  };
  doc.startViewTransition = (cb) => {
    transicoes++;
    cb();
    classesNaCaptura = document.documentElement.className;
    return { ready: Promise.resolve(), finished: new Promise<void>((r) => setTimeout(r, 20)) };
  };
});

afterEach(() => {
  delete doc.startViewTransition;
  delete html.animate;
  definirModoDesempenho('normal');
});

async function trocar(reduzir = false) {
  const aplicados: Theme[] = [];
  await trocarTema({ novo: 'light', anterior: 'dark', aplicar: (t) => aplicados.push(t), reduzir });
  await new Promise((r) => setTimeout(r, 0)); // o `ready.then` que anima
  return aplicados;
}

describe('troca de tema conforme o desempenho', () => {
  it('aparelho bom: revelação circular (clip-path)', async () => {
    definirModoDesempenho('normal');
    expect(await trocar()).toEqual(['light']);
    expect(transicoes).toBe(1);
    expect(animacoes.some((a) => 'clipPath' in a.quadros)).toBe(true);
    expect(animacoes.some((a) => 'opacity' in a.quadros)).toBe(false);
  });

  it('modo leve: esmaecimento da página inteira, sem círculo', async () => {
    definirModoDesempenho('leve');
    expect(await trocar()).toEqual(['light']);
    expect(transicoes).toBe(1);
    expect(animacoes.some((a) => 'clipPath' in a.quadros)).toBe(false);
    expect(animacoes.map((a) => a.pseudo).sort()).toEqual(['::view-transition-new(root)', '::view-transition-old(root)']);
    expect(animacoes.every((a) => 'opacity' in a.quadros)).toBe(true);
    // esmaecimento cruzado com soma das capturas (index.css) e sem transições CSS por baixo
    expect(classesNaCaptura).toContain('vt-cena');
    expect(classesNaCaptura).toContain('tema-em-troca');
    expect(document.documentElement.classList.contains('vt-cena')).toBe(false);
  });

  it('modo leve com fundo de cena: não roda a sequência da cena, só o esmaecimento', async () => {
    definirModoDesempenho('leve');
    let pedidos = 0;
    const sair = registrarCena(async () => {
      pedidos++;
      return true;
    });
    try {
      expect(await trocar()).toEqual(['light']);
      expect(pedidos).toBe(0);
      expect(animacoes.every((a) => 'opacity' in a.quadros)).toBe(true);
    } finally {
      sair();
    }
  });

  it('movimento reduzido continua mandando: troca direta, sem vídeo, mesmo no modo leve', async () => {
    definirModoDesempenho('leve');
    expect(await trocar(true)).toEqual(['light']);
    expect(transicoes).toBe(0);
    expect(animacoes).toHaveLength(0);
  });

  it('o <html> leva o contrato com o design system (data-desempenho)', () => {
    definirModoDesempenho('leve');
    expect(document.documentElement.dataset.desempenho).toBe('leve');
    definirModoDesempenho('normal');
    expect(document.documentElement.dataset.desempenho).toBe('normal');
  });
});
