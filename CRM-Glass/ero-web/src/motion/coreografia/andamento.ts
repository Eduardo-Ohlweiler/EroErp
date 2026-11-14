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
/** Quando alguma montagem começou ou terminou pela última vez (ms, performance.now). */
let ultimoMovimento = -Infinity;

function conferir() {
  if (relogio !== undefined) clearTimeout(relogio);
  relogio = undefined;
  if (ativos.size || !esperando.size) return;
  // "Parada" = nenhuma montagem por `folgaTema` (cobre o quadro entre a saída de uma tela e a entrada da outra).
  // Conta desde o último movimento: quem chega com tudo parado há mais que isso não espera a folga de novo
  // (ex.: a troca de tema logo depois da saída da Aparência, que já esperou a folga).
  const restante = Math.max(0, montagem.folgaTema * 1000 - (performance.now() - ultimoMovimento));
  relogio = setTimeout(() => {
    relogio = undefined;
    if (ativos.size) return;
    const fila = [...esperando];
    esperando.clear();
    fila.forEach((f) => f());
  }, restante);
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
      if (ativos.delete(meu)) ultimoMovimento = performance.now();
      conferir();
    };
  }, []);
  return useMemo(
    () => ({
      onAnimationStart: () => {
        ativos.add(id.current);
        ultimoMovimento = performance.now();
        conferir();
      },
      onAnimationComplete: () => {
        ativos.delete(id.current);
        ultimoMovimento = performance.now();
        conferir();
      },
    }),
    [],
  );
}
