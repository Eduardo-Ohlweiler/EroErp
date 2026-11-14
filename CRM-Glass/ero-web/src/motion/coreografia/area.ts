import { useState } from 'react';
import type { NomeCoreografia } from '../tokens';

/** Prefixo da chave de área da casca: `casca:${tenantId}` (ou `casca:plataforma`). */
export const PREFIXO_CASCA = 'casca:';

/**
 * Coreografia da troca entre duas áreas da TrocaDeArea:
 *  - casca → casca de OUTRO contratante (superadmin entrando ou saindo de um contratante): `contexto`;
 *  - qualquer outra (login ↔ casca, primeira montagem): a padrão (`undefined`).
 */
export function coreografiaDaTroca(anterior: string | null, nova: string): NomeCoreografia | undefined {
  if (anterior === null || anterior === nova) return undefined;
  return anterior.startsWith(PREFIXO_CASCA) && nova.startsWith(PREFIXO_CASCA) ? 'contexto' : undefined;
}

/**
 * Coreografia para a TrocaDeArea da raiz, calculada quando a chave muda e FIXA até a próxima troca: a área nova
 * monta com o atraso dela, e esse atraso não muda no meio da montagem (o que a faria recalcular os tempos).
 *
 *   const coreografia = useCoreografiaDaArea(chave);
 *   <TrocaDeArea chave={chave} coreografia={coreografia} aoSairCompleto={aplicarArea}>{outlet}</TrocaDeArea>
 */
export function useCoreografiaDaArea(chave: string): NomeCoreografia | undefined {
  const [estado, setEstado] = useState<{ chave: string; coreografia?: NomeCoreografia }>({ chave });
  if (estado.chave !== chave) {
    const novo = { chave, coreografia: coreografiaDaTroca(estado.chave, chave) };
    setEstado(novo); // estado derivado da chave: o React refaz este render na hora, antes de pintar
    return novo.coreografia;
  }
  return estado.coreografia;
}
