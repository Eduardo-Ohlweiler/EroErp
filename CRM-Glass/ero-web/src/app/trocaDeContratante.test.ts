import { describe, expect, it } from 'vitest';
import { limparCacheAoTrocarDeArea } from './trocaDeContratante';

describe('cache das telas na troca de contratante', () => {
  it('limpa quando a casca de um contratante dá lugar à de outro (entrar e sair de um contratante)', () => {
    expect(limparCacheAoTrocarDeArea('casca:plataforma', 'casca:t1')).toBe(true);
    expect(limparCacheAoTrocarDeArea('casca:t1', 'casca:plataforma')).toBe(true);
    expect(limparCacheAoTrocarDeArea('casca:t1', 'casca:t2')).toBe(true);
  });

  it('não limpa na primeira montagem, na mesma casca nem entre login e casca', () => {
    expect(limparCacheAoTrocarDeArea(null, 'casca:t1')).toBe(false);
    expect(limparCacheAoTrocarDeArea('casca:t1', 'casca:t1')).toBe(false);
    expect(limparCacheAoTrocarDeArea('login', 'casca:t1')).toBe(false);
    expect(limparCacheAoTrocarDeArea('casca:t1', 'login')).toBe(false);
  });
});
