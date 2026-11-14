import { createContext, useContext } from 'react';
import type { Variants } from 'motion/react';
import type { NomeCoreografia } from '../tokens';

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

/**
 * Coreografia da <Tela> em volta (`padrao`, `formulario`...). Os blocos do kit T* leem por `useVariantesDoPapel`
 * para encaixar no ritmo da tela; fora de uma <Tela>, `null` (o papel cai no da coreografia `padrao`).
 */
export const CoreografiaDaTela = createContext<NomeCoreografia | null>(null);

export function useCoreografiaDaTela() {
  return useContext(CoreografiaDaTela);
}

/**
 * A <Tela> em volta já terminou a primeira montagem? (`current` vira true no primeiro efeito dela.)
 * Quem nasce junto com a tela (current false) faz parte da coreografia dela; quem nasce depois (aba trocada,
 * conteúdo que chegou) anima por conta própria. Fora de uma <Tela>, `null`. Uso: ConteudoDeAba.
 */
export const TelaMontada = createContext<{ readonly current: boolean } | null>(null);

export function useTelaMontada() {
  return useContext(TelaMontada);
}
