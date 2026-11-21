import { describe, expect, it } from 'vitest';
import {
  AUSENTE,
  cnpjCru,
  documentoCru,
  formatarData,
  formatarDocumento,
  formatarDuracao,
  formatarMoeda,
  mascararCep,
  mascararCnpj,
  mascararColado,
  mascararCpf,
  mascararCpfCnpj,
  mascararDecimal,
  mascararHora,
  mascararTelefone,
  paraNumero,
  rotuloDe,
  somenteDigitos,
  textoDaMascara,
} from './format';

describe('CPF e CNPJ (alfanumérico)', () => {
  it('CPF pontua enquanto se digita e ignora letras', () => {
    expect(mascararCpf('123')).toBe('123');
    expect(mascararCpf('1234')).toBe('123.4');
    expect(mascararCpf('1234567')).toBe('123.456.7');
    expect(mascararCpf('12345678909')).toBe('123.456.789-09');
    expect(mascararCpf('123.456.789-0912')).toBe('123.456.789-09');
    expect(mascararCpf('12a3')).toBe('123');
  });

  it('CNPJ numérico de sempre', () => {
    expect(mascararCnpj('11222333000181')).toBe('11.222.333/0001-81');
    expect(mascararCnpj('112223')).toBe('11.222.3');
  });

  it('CNPJ alfanumérico: 12 [0-9A-Z] em maiúsculas + 2 dígitos', () => {
    expect(mascararCnpj('12abc34501de35')).toBe('12.ABC.345/01DE-35');
    expect(cnpjCru('12.ABC.345/01DE-35')).toBe('12ABC34501DE35');
    // letra nas posições do dígito verificador é descartada
    expect(cnpjCru('12ABC34501DEX3Y5')).toBe('12ABC34501DE35');
    expect(cnpjCru('12ABC34501DE3599')).toBe('12ABC34501DE35');
  });

  it('cpfCnpj alterna sozinho: até 11 dígitos CPF; letra ou 12º caractere, CNPJ', () => {
    expect(mascararCpfCnpj('12345678909')).toBe('123.456.789-09');
    expect(mascararCpfCnpj('112223330001')).toBe('11.222.333/0001');
    expect(mascararCpfCnpj('12A')).toBe('12.A');
    expect(mascararCpfCnpj('12abc34501de35')).toBe('12.ABC.345/01DE-35');
    expect(documentoCru('12.abc.345/01de-35')).toBe('12ABC34501DE35');
    expect(documentoCru('123.456.789-09')).toBe('12345678909');
  });

  it('formatarDocumento exibe o valor cru da API', () => {
    expect(formatarDocumento('12345678909')).toBe('123.456.789-09');
    expect(formatarDocumento('11222333000181')).toBe('11.222.333/0001-81');
    expect(formatarDocumento('12ABC34501DE35')).toBe('12.ABC.345/01DE-35');
    expect(formatarDocumento('12.ABC.345/01DE-35')).toBe('12.ABC.345/01DE-35');
    expect(formatarDocumento('123')).toBe('123');
    expect(formatarDocumento(null)).toBe(AUSENTE);
    expect(formatarDocumento('')).toBe(AUSENTE);
  });
});

describe('CEP, telefone e hora', () => {
  it('pontuam progressivamente', () => {
    expect(mascararCep('01310100')).toBe('01310-100');
    expect(mascararCep('0131')).toBe('0131');
    expect(mascararTelefone('11')).toBe('(11');
    expect(mascararTelefone('1134567890')).toBe('(11) 3456-7890');
    expect(mascararTelefone('11987654321')).toBe('(11) 98765-4321');
    expect(mascararHora('0930')).toBe('09:30');
    expect(mascararHora('9')).toBe('9');
    expect(somenteDigitos('(11) 98765-4321')).toBe('11987654321');
    expect(somenteDigitos('')).toBeUndefined();
  });
});

describe('números', () => {
  it('inteiro: casas 0, sem zero à esquerda, vazio continua vazio', () => {
    expect(mascararDecimal('007', 0)).toBe('7');
    expect(mascararDecimal('25', 0)).toBe('25');
    expect(mascararDecimal('2a5', 0)).toBe('25');
    expect(mascararDecimal('', 0)).toBe('');
  });

  it('decimal: os dígitos entram pela direita', () => {
    expect(mascararDecimal('7250')).toBe('72,50');
    expect(mascararDecimal('123456')).toBe('1.234,56');
    expect(mascararDecimal('-5', 2, true)).toBe('-0,05');
    expect(mascararDecimal('-5', 2, false)).toBe('0,05');
  });

  it('colar relê como número (70 vira 70,00, não 0,70)', () => {
    expect(mascararColado('70')).toBe('70,00');
    expect(mascararColado('1.234,5')).toBe('1.234,50');
  });

  it('paraNumero aceita vírgula ou ponto e desfaz a ambiguidade do ponto', () => {
    expect(paraNumero('1.234,56')).toBe(1234.56);
    expect(paraNumero('1.234.567')).toBe(1234567);
    expect(paraNumero('1.500')).toBe(1500);
    expect(paraNumero('72.5')).toBe(72.5);
    expect(paraNumero('0.750')).toBe(0.75);
    expect(paraNumero('72,50')).toBe(72.5);
    expect(paraNumero('25')).toBe(25);
    expect(paraNumero('')).toBeUndefined();
    expect(paraNumero('  ')).toBeUndefined();
    expect(paraNumero(null)).toBeUndefined();
    expect(paraNumero('abc')).toBeUndefined();
  });

  it('textoDaMascara reabre o número como a máscara o teria escrito', () => {
    expect(textoDaMascara(72.5)).toBe('72,50');
    expect(textoDaMascara(null)).toBe('');
    expect(formatarMoeda(1234.5)).toBe('R$ 1.234,50');
    expect(formatarMoeda(undefined)).toBe(AUSENTE);
  });
});

describe('datas e enum', () => {
  it('data sem hora é dia do calendário (não volta um dia no Brasil)', () => {
    expect(formatarData('2027-08-07')).toBe('07/08/2027');
    expect(formatarData(null)).toBe(AUSENTE);
  });

  it('rotuloDe não devolve o valor cru', () => {
    const op = [{ valor: 'UM_MES', rotulo: '1 mês' }] as const;
    expect(rotuloDe(op, 'UM_MES')).toBe('1 mês');
    expect(rotuloDe(op, undefined)).toBeUndefined();
  });
});

describe('duração em minutos', () => {
  it('minutos, horas cheias e horas com minutos', () => {
    expect(formatarDuracao(45)).toBe('45 min');
    expect(formatarDuracao(1)).toBe('1 min');
    expect(formatarDuracao(60)).toBe('1 h');
    expect(formatarDuracao(90)).toBe('1 h 30 min');
    expect(formatarDuracao(125)).toBe('2 h 5 min');
    expect(formatarDuracao(1440)).toBe('24 h');
  });

  it('ausente, zero ou inválida vira travessão', () => {
    expect(formatarDuracao(null)).toBe(AUSENTE);
    expect(formatarDuracao(undefined)).toBe(AUSENTE);
    expect(formatarDuracao(0)).toBe(AUSENTE);
    expect(formatarDuracao(Number.NaN)).toBe(AUSENTE);
  });
});
