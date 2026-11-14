import { describe, expect, it } from 'vitest';
import { formatarTelefone, telefoneOpcionalSchema, telefoneParaApi, telefoneParaForm } from './telefone';
import { gerarSenhaTemporaria } from './senha';

describe('telefone opcional', () => {
  it('aceita vazio, 10 e 11 dígitos', () => {
    expect(telefoneOpcionalSchema.safeParse('').success).toBe(true);
    expect(telefoneOpcionalSchema.safeParse('1134567890').success).toBe(true);
    expect(telefoneOpcionalSchema.safeParse('11987654321').success).toBe(true);
  });

  it('recusa curto ou longo, com a mensagem da API', () => {
    const r = telefoneOpcionalSchema.safeParse('123');
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe('Telefone deve ter 10 ou 11 dígitos.');
    expect(telefoneOpcionalSchema.safeParse('119876543210').success).toBe(false);
  });

  it('vai para a API só com dígitos, vazio vira null', () => {
    expect(telefoneParaApi('')).toBeNull();
    expect(telefoneParaApi('(11) 98765-4321')).toBe('11987654321');
    expect(telefoneParaForm(null)).toBe('');
    expect(telefoneParaForm('11987654321')).toBe('11987654321');
  });

  it('formata fixo e celular para a grade', () => {
    expect(formatarTelefone('1134567890')).toBe('(11) 3456-7890');
    expect(formatarTelefone('11987654321')).toBe('(11) 98765-4321');
    expect(formatarTelefone(null)).toBe('—');
  });
});

describe('senha temporária gerada', () => {
  it('tem 16 caracteres do alfabeto sem ambíguos', () => {
    const s = gerarSenhaTemporaria();
    expect(s).toHaveLength(16);
    expect(s).toMatch(/^[a-hjkmnp-zA-HJ-NP-Z2-9]+$/);
  });

  it('descarta o byte que daria viés', () => {
    // 255 passa do maior múltiplo do alfabeto (55 × 4 = 220): é descartado; 0 vira "a".
    const sorteio = (b: Uint8Array) => b.map((_, i) => (i % 2 === 0 ? 255 : 0));
    expect(gerarSenhaTemporaria(4, sorteio)).toBe('aaaa');
  });
});
