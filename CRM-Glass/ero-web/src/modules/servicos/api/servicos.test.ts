import { describe, expect, it } from 'vitest';
import { faixaDePrecos, rotuloDoServico, servicoSelectSchema } from './servicos';

const v = (valor: number | null) => ({ valor });

describe('faixa de preços da lista', () => {
  it('nenhuma filial com preço vira travessão', () => {
    expect(faixaDePrecos([])).toBe('—');
    expect(faixaDePrecos([v(null), v(null)])).toBe('—');
  });

  it('um preço só, ou todos iguais, aparece uma vez', () => {
    expect(faixaDePrecos([v(90)])).toBe('R$ 90,00');
    expect(faixaDePrecos([v(90), v(90), v(null)])).toBe('R$ 90,00');
  });

  it('preços diferentes viram "menor – maior", ignorando o não informado', () => {
    expect(faixaDePrecos([v(120), v(90), v(null)])).toBe('R$ 90,00 – R$ 120,00');
    expect(faixaDePrecos([v(1234.5), v(90)])).toBe('R$ 90,00 – R$ 1.234,50');
  });

  it('gratuito (zero) conta como preço', () => {
    expect(faixaDePrecos([v(0), v(50)])).toBe('R$ 0,00 – R$ 50,00');
    expect(faixaDePrecos([v(0)])).toBe('R$ 0,00');
  });
});

describe('rótulo do serviço', () => {
  it('código · nome, nunca preço', () => {
    expect(rotuloDoServico({ codServico: 3, nome: 'Manutenção' })).toBe('3 · Manutenção');
    expect(servicoSelectSchema.parse({ id: 's1', codServico: 3, nome: 'Manutenção' })).toEqual({ id: 's1', codServico: 3, nome: 'Manutenção' });
  });
});
