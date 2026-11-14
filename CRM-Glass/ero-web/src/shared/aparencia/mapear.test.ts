import { describe, expect, it } from 'vitest';
import { APARENCIA_PADRAO, PADRAO_SISTEMA, deApi, fundoDeCodigo, paraApi, prenderFoco, prenderVidro, sanear } from './mapear';

describe('mapear aparência', () => {
  it('traduz a aparência completa da API', () => {
    expect(
      deApi({
        corDestaque: 'azul',
        temaPadrao: 'CLARO',
        fundo: 'MARINA',
        fundoAnimado: false,
        vidroDesfoque: 20,
        fundoFoco: 4.5,
        animacoes: 'REDUZIDAS',
      }),
    ).toEqual({
      accent: 'azul',
      theme: 'light',
      fundo: 'marina',
      fundoAnimado: false,
      blur: 20,
      fundoFoco: 4.5,
      movimento: 'reduzida',
      desempenhoAutomatico: false,
    });
  });

  it('descarta o que não está na lista branca', () => {
    expect(
      deApi({
        corDestaque: 'red; background:url(x)',
        temaPadrao: 'dark',
        fundo: 'PRAIA',
        fundoAnimado: 'sim',
        vidroDesfoque: 'abc',
        fundoFoco: null,
        animacoes: 'TODAS',
        desempenhoAutomatico: 'true',
        __proto__: { temaPadrao: 'CLARO' },
      }),
    ).toEqual({ desempenhoAutomatico: false });
    expect(deApi(null)).toEqual({});
    expect(deApi('ESCURO')).toEqual({});
  });

  it('prende os números aos limites', () => {
    expect(prenderVidro(41)).toBe(40);
    expect(prenderVidro(-1)).toBe(0);
    expect(prenderVidro(12.6)).toBe(13);
    expect(prenderFoco(10.5)).toBe(10);
    expect(prenderFoco(3.25)).toBe(3.5);
    expect(prenderFoco('3.0')).toBe(3);
    expect(prenderFoco(Number.NaN)).toBeNull();
    expect(prenderVidro(Infinity)).toBeNull();
  });

  it('mapeia código de fundo para id do front', () => {
    expect(fundoDeCodigo('ESCRITORIO')).toBe('escritorio');
    expect(fundoDeCodigo('../../x')).toBeNull();
    expect(fundoDeCodigo(1)).toBeNull();
  });

  it('ida e volta mantém os valores', () => {
    expect(deApi(paraApi(PADRAO_SISTEMA))).toEqual(PADRAO_SISTEMA);
    expect(APARENCIA_PADRAO).toEqual({
      corDestaque: 'violeta',
      temaPadrao: 'ESCURO',
      fundo: 'ORBS',
      fundoAnimado: true,
      vidroDesfoque: 12,
      fundoFoco: 3,
      animacoes: 'COMPLETAS',
      desempenhoAutomatico: false,
    });
  });

  it('sanear aceita só ajustes válidos do front', () => {
    expect(sanear({ theme: 'light', blur: 99 })).toEqual({ theme: 'light', blur: 40 });
    expect(sanear({ theme: 'roxo' as never })).toEqual({});
    expect(sanear({ desempenhoAutomatico: true })).toEqual({ desempenhoAutomatico: true });
  });

  it('otimizar desempenho: ausente ou inválido vira false; true passa; e vai sempre para a API', () => {
    expect(deApi({ corDestaque: 'azul' })).toEqual({ accent: 'azul', desempenhoAutomatico: false });
    expect(deApi({ desempenhoAutomatico: true })).toEqual({ desempenhoAutomatico: true });
    expect(deApi({ desempenhoAutomatico: 1 })).toEqual({ desempenhoAutomatico: false });
    expect(deApi({ desempenhoAutomatico: null })).toEqual({ desempenhoAutomatico: false });
    expect(PADRAO_SISTEMA.desempenhoAutomatico).toBe(false);
    expect(APARENCIA_PADRAO.desempenhoAutomatico).toBe(false);
    expect(paraApi({ ...PADRAO_SISTEMA, desempenhoAutomatico: true }).desempenhoAutomatico).toBe(true);
    expect(deApi(paraApi({ ...PADRAO_SISTEMA, desempenhoAutomatico: true }))).toEqual({ ...PADRAO_SISTEMA, desempenhoAutomatico: true });
  });
});
