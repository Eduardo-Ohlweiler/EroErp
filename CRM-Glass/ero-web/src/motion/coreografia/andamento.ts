import { useEffect, useMemo, useRef } from 'react';
import { montagem } from '../tokens';

/*
 * Sabe se alguma tela está montando ou desmontando agora.
 * A troca de tema em vídeo usa isso para começar a View Transition só com a tela parada: a captura
 * antiga é uma foto estática, e cartões ainda se mexendo por baixo apareceriam duplicados.
 * Tela, RotaAnimada e TrocaDeArea marcam o começo e o fim das suas animações aqui.
 */

const ativos = new Set<number>();
const esperando = new Set<() => void>();
let sequencia = 0;
let relogio: ReturnType<typeof setTimeout> | undefined;

function conferir() {
  if (relogio !== undefined) clearTimeout(relogio);
  relogio = undefined;
  if (ativos.size || !esperando.size) return;
  // "Parada" = nenhuma montagem por `folgaTema` (cobre o quadro entre a saída de uma tela e a entrada da outra).
  relogio = setTimeout(() => {
    relogio = undefined;
    if (ativos.size) return;
    const fila = [...esperando];
    esperando.clear();
    fila.forEach((f) => f());
  }, montagem.folgaTema * 1000);
}

/** true enquanto alguma tela monta ou desmonta. */
export function telaEmMovimento() {
  return ativos.size > 0;
}

/**
 * Resolve quando nenhuma tela estiver montando ou desmontando (depois de `montagem.folgaTema`),
 * ou depois de `limite` segundos, o que vier primeiro.
 */
export function aguardarTelaParada(limite = montagem.esperaTema) {
  return new Promise<void>((resolve) => {
    const fim = () => {
      clearTimeout(teto);
      esperando.delete(fim);
      resolve();
    };
    const teto = setTimeout(fim, limite * 1000);
    esperando.add(fim);
    conferir();
  });
}

/** Handlers para o motion.div que monta/desmonta uma tela. Some do registro ao desmontar. */
export function useMarcarMontagem() {
  const id = useRef(0);
  if (!id.current) id.current = ++sequencia;
  useEffect(() => {
    const meu = id.current;
    return () => {
      ativos.delete(meu);
      conferir();
    };
  }, []);
  return useMemo(
    () => ({
      onAnimationStart: () => {
        ativos.add(id.current);
        conferir();
      },
      onAnimationComplete: () => {
        ativos.delete(id.current);
        conferir();
      },
    }),
    [],
  );
}
