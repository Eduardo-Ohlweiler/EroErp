import { createContext, useContext } from 'react'

/** O `somenteLeitura` do `TForm`, para campos e botões lerem sem prop. */
export const SomenteLeituraDoForm = createContext(false)

/** Verdadeiro dentro de um `TForm somenteLeitura`. */
export function useSomenteLeituraDoForm(): boolean {
  return useContext(SomenteLeituraDoForm)
}
