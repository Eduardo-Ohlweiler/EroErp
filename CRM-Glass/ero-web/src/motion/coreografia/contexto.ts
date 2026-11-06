import { createContext, useContext } from 'react';
import type { Variants } from 'motion/react';

/**
 * Atraso de montagem herdado (s): quanto a tela que está nascendo deve esperar antes do primeiro bloco.
 * TrocaDeArea soma a pausa da coreografia (ex.: `contexto`), e RotaAnimada soma `casca.atrasoConteudo`
 * na primeira tela depois que a casca monta (menu → barra → blocos). Sidebar e Topbar também leem.
 */
export const AtrasoMontagem = createContext(0);

export function useAtrasoMontagem() {
  return useContext(AtrasoMontagem);
}

/**
 * Bloco padrão da coreografia em volta (a <Tela> fornece): `formulario` e `etapa` usam o bloco curto.
 * Os componentes do design system leem via `useVariantesBloco`; `variants` passadas a eles ainda vencem.
 */
export const BlocoDaTela = createContext<Variants | null>(null);

export function useBlocoDaTela() {
  return useContext(BlocoDaTela);
}
