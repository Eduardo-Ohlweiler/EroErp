import { PREFIXO_CASCA } from '../motion/coreografia/area';

/**
 * A área que acabou de sair era a casca de um contratante e a que vai entrar é a de outro (o superadmin entrou ou
 * saiu de um contratante)? Então o cache das telas é do contratante anterior e precisa ser limpo AGORA: a casca
 * antiga já se desfez (não mostra mais nada) e a nova ainda não montou (não leu nada).
 *
 * login ↔ casca não entra aqui: sair e expirar já limpam o cache (`SessaoProvider.encerrar`), e entrar começa
 * com ele vazio.
 */
export function limparCacheAoTrocarDeArea(anterior: string | null, nova: string): boolean {
  return anterior !== null && anterior !== nova && anterior.startsWith(PREFIXO_CASCA) && nova.startsWith(PREFIXO_CASCA);
}
