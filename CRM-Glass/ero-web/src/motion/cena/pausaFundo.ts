import { useSyncExternalStore } from 'react';

/*
 * Pausa das animações do fundo vivo (orbs, aurora, ondas) enquanto a revelação circular do tema roda:
 * a imagem nova da View Transition é ao vivo, e orbs com desfoque se mexendo por baixo do clip-path
 * custam quadros numa GPU integrada. O LiveBackground põe a classe `paused` (index.css) enquanto vale.
 */
let pausado = false;
const ouvintes = new Set<() => void>();

export function pausarFundo(valor: boolean) {
  if (pausado === valor) return;
  pausado = valor;
  ouvintes.forEach((f) => f());
}

export function useFundoPausado() {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },
    () => pausado,
    () => false,
  );
}
