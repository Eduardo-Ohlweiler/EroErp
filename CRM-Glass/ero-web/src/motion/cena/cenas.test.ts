import { describe, expect, it } from 'vitest';
import { CENAS, carregadorDaCenaExclusiva, ehCena, ehCenaExclusiva } from './cenas';

describe('cenas exclusivas (F5): só o que foi registrado, nunca o que o objeto herda', () => {
  it('nomes herdados de Object não são cena', () => {
    for (const id of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
      expect(ehCenaExclusiva(id), id).toBe(false);
      expect(carregadorDaCenaExclusiva(id), id).toBeUndefined();
      expect(ehCena(id), id).toBe(false);
    }
  });

  it('as cenas públicas continuam sendo cena', () => {
    for (const c of CENAS) expect(ehCena(c.id)).toBe(true);
    expect(ehCena('orbs')).toBe(false);
  });
});
