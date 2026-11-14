import { describe, expect, it } from 'vitest';
import { usuarioLogadoSchema } from './tipos';

const base = {
  id: 'u1',
  nome: 'Ana Ribeiro',
  email: 'ana@demo.com.br',
  papel: 'ADMIN',
  tenantId: 't1',
  tenantNome: 'Demo Solar',
  aparencia: { temaPadrao: 'ESCURO' },
  superadminAtuando: false,
  pendencia: 'NENHUMA',
  permissoes: [],
  telas: [],
};

describe('usuarioLogadoSchema: temaPreferido', () => {
  it('aceita CLARO e ESCURO', () => {
    expect(usuarioLogadoSchema.parse({ ...base, temaPreferido: 'CLARO' }).temaPreferido).toBe('CLARO');
    expect(usuarioLogadoSchema.parse({ ...base, temaPreferido: 'ESCURO' }).temaPreferido).toBe('ESCURO');
  });

  it('null segue o contratante', () => {
    expect(usuarioLogadoSchema.parse({ ...base, temaPreferido: null }).temaPreferido).toBeNull();
  });

  it('ausente (API antiga) vira null', () => {
    expect(usuarioLogadoSchema.parse(base).temaPreferido).toBeNull();
  });

  it('valor desconhecido vira null sem derrubar a sessão', () => {
    const u = usuarioLogadoSchema.parse({ ...base, temaPreferido: 'SEPIA' });
    expect(u.temaPreferido).toBeNull();
    expect(u.nome).toBe('Ana Ribeiro');
  });
});
