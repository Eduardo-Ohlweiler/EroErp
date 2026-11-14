import { createContext, useContext } from 'react';
import { useUsuarioAtual } from '../../shared/sessao';

/** O `somenteLeitura` do `TForm`, para campos e botões lerem sem prop. */
export const SomenteLeituraDoForm = createContext(false);

/** Verdadeiro dentro de um `TForm somenteLeitura`. */
export function useSomenteLeituraDoForm(): boolean {
  return useContext(SomenteLeituraDoForm);
}

/**
 * Só leitura pela permissão (função pura): sem grupo (tela presa ao papel, ex.: Contratantes) é `false`;
 * com grupo, `true` quando as permissões **não** trazem `<GRUPO>_ESCREVER` (docs/04-permissoes.md).
 */
export function somenteLeituraPara(permissoes: readonly string[] | undefined, grupo?: string): boolean {
  if (!grupo) return false;
  return !(permissoes ?? []).includes(`${grupo}_ESCREVER`);
}

/**
 * `useSomenteLeitura('USUARIOS')` → `true` se o usuário só lê a tela. Lê o `GET /api/auth/eu` da casca.
 * Tela presa ao papel (Contratantes, Configuração do contratante) chama sem argumento e recebe `false`.
 */
export function useSomenteLeitura(grupo?: string): boolean {
  const usuario = useUsuarioAtual();
  return somenteLeituraPara(usuario.permissoes, grupo);
}
