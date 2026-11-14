import { describe, expect, it } from 'vitest';
import { descreverAgente } from './agente';

const UA = {
  chromeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  edgeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  firefoxLinux: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0',
  safariIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  chromeIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  samsungAndroid:
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  operaMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 OPR/115.0.0.0',
};

describe('navegador em português (sessões e Logs)', () => {
  it('reconhece navegador e sistema', () => {
    expect(descreverAgente(UA.chromeWindows)).toBe('Chrome no Windows');
    expect(descreverAgente(UA.edgeWindows)).toBe('Edge no Windows');
    expect(descreverAgente(UA.firefoxLinux)).toBe('Firefox no Linux');
    expect(descreverAgente(UA.safariIphone)).toBe('Safari no iPhone');
    expect(descreverAgente(UA.chromeIphone)).toBe('Chrome no iPhone');
    expect(descreverAgente(UA.chromeAndroid)).toBe('Chrome no Android');
    expect(descreverAgente(UA.samsungAndroid)).toBe('Samsung Internet no Android');
    expect(descreverAgente(UA.safariMac)).toBe('Safari no macOS');
    expect(descreverAgente(UA.operaMac)).toBe('Opera no macOS');
    expect(
      descreverAgente('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.0.0 Safari/537.36'),
    ).toBe('Chrome no Windows');
  });

  it('o que não reconhece não quebra', () => {
    expect(descreverAgente(null)).toBe('—');
    expect(descreverAgente('   ')).toBe('—');
    expect(descreverAgente('curl/8.4.0')).toBe('Navegador desconhecido');
    expect(descreverAgente('Mozilla/5.0 (Windows NT 10.0) Algo/1.0')).toBe('Navegador no Windows');
  });
});
