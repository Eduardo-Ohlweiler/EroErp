import { describe, expect, it } from 'vitest';
import { fmtMinSeg, instanteMs, segundosAte } from './tempo';
import { primeiroNome, saudacao } from './utils';

describe('contagens', () => {
  it('segundosAte arredonda para cima e nunca fica negativo', () => {
    expect(segundosAte(10_000, 0)).toBe(10);
    expect(segundosAte(10_001, 0)).toBe(11);
    expect(segundosAte(999, 0)).toBe(1);
    expect(segundosAte(0, 5000)).toBe(0);
    expect(segundosAte(null, 0)).toBe(0);
  });

  it('fmtMinSeg', () => {
    expect(fmtMinSeg(600)).toBe('10:00');
    expect(fmtMinSeg(75)).toBe('1:15');
    expect(fmtMinSeg(9)).toBe('0:09');
    expect(fmtMinSeg(0)).toBe('0:00');
    expect(fmtMinSeg(-3)).toBe('0:00');
  });

  it('instanteMs lê ISO e usa o padrão quando falta', () => {
    expect(instanteMs('2026-11-11T12:10:00Z', 0)).toBe(Date.parse('2026-11-11T12:10:00Z'));
    expect(instanteMs(null, 42)).toBe(42);
    expect(instanteMs('ontem', 42)).toBe(42);
  });
});

describe('Início', () => {
  it('saudação pela hora', () => {
    const em = (h: number) => new Date(2026, 10, 11, h, 30);
    expect(saudacao(em(4))).toBe('Boa noite');
    expect(saudacao(em(5))).toBe('Bom dia');
    expect(saudacao(em(11))).toBe('Bom dia');
    expect(saudacao(em(12))).toBe('Boa tarde');
    expect(saudacao(em(17))).toBe('Boa tarde');
    expect(saudacao(em(18))).toBe('Boa noite');
  });

  it('primeiro nome', () => {
    expect(primeiroNome('  Ana Paula Ribeiro ')).toBe('Ana');
    expect(primeiroNome('Bruno')).toBe('Bruno');
  });
});
