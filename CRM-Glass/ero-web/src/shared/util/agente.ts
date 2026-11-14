import { AUSENTE } from './format';

/*
 * O "user agent" que a API guarda (sessões e Logs) em português: "Chrome no Windows", "Safari no iPhone".
 * Só para mostrar; não decide nada. A ordem dos testes importa: o Edge e o Opera também dizem "Chrome", o Chrome
 * também diz "Safari", e o Android também diz "Linux".
 */

const NAVEGADORES: [RegExp, string][] = [
  [/\bEdg(e|A|iOS)?\//, 'Edge'],
  [/\b(OPR|Opera)\//, 'Opera'],
  [/\bSamsungBrowser\//, 'Samsung Internet'],
  [/\b(Firefox|FxiOS)\//, 'Firefox'],
  [/(\b|Headless)(Chrome|CriOS|Chromium)\//, 'Chrome'],
  [/\bVersion\/[\d.]+.*\bSafari\//, 'Safari'],
];

const SISTEMAS: [RegExp, string][] = [
  [/\biPhone\b/, 'iPhone'],
  [/\biPad\b/, 'iPad'],
  [/\bAndroid\b/, 'Android'],
  [/\bWindows\b/, 'Windows'],
  [/\bCrOS\b/, 'ChromeOS'],
  [/\bMac OS X\b|\bMacintosh\b/, 'macOS'],
  [/\bLinux\b/, 'Linux'],
];

const achar = (lista: [RegExp, string][], texto: string) => lista.find(([r]) => r.test(texto))?.[1];

/** "Chrome no Windows"; só o navegador ou só o sistema quando o outro não se reconhece; vazio vira travessão. */
export function descreverAgente(agente?: string | null): string {
  const texto = agente?.trim();
  if (!texto) return AUSENTE;
  const navegador = achar(NAVEGADORES, texto);
  const sistema = achar(SISTEMAS, texto);
  if (navegador && sistema) return `${navegador} no ${sistema}`;
  if (navegador) return navegador;
  if (sistema) return `Navegador no ${sistema}`;
  return 'Navegador desconhecido';
}
