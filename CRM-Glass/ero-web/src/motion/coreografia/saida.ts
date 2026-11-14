import { useEffect, useRef } from 'react';
import { usePresence } from 'motion/react';
import { montagem } from '../tokens';
import { aguardarTelaParada } from './andamento';

/**
 * Uma tarefa entre a saída desta tela e a montagem da próxima. Ordem:
 *   1. a tela se desmonta em blocos (a coreografia dela);
 *   2. com a tela parada, roda `tarefa` e espera a Promise dela;
 *   3. só então a RotaAnimada (modo 'wait') monta a próxima tela.
 * A espera tem teto (`limite`, padrão `montagem.esperaSaida`): passou dele, a próxima tela monta assim mesmo.
 * Se a tela voltar a ficar presente antes da tarefa rodar (o usuário voltou para ela), a tarefa não roda.
 *
 * Funciona dentro de qualquer AnimatePresence (RotaAnimada, TrocaDeArea com `propagate`): quando a área inteira
 * sai (logout), a área também espera. Fora de um AnimatePresence, não faz nada (use um cleanup de efeito).
 * Exemplo: usePreviaDaTela (motion/cena/previaDaTela.ts).
 */
export function useAntesDaProximaTela(tarefa: () => void | Promise<void>, { limite = montagem.esperaSaida }: { limite?: number } = {}) {
  const [presente, liberar] = usePresence();
  const atual = useRef(tarefa);
  atual.current = tarefa;

  useEffect(() => {
    if (presente || !liberar) return;
    let vivo = true;
    let teto: ReturnType<typeof setTimeout> | undefined;
    const soltar = () => {
      clearTimeout(teto);
      if (vivo) liberar();
      vivo = false;
    };
    (async () => {
      await aguardarTelaParada(); // os blocos terminaram de sair
      if (!vivo) return;
      teto = setTimeout(soltar, limite * 1000);
      try {
        await atual.current();
      } catch {
        /* a próxima tela monta mesmo se a tarefa falhar */
      }
      soltar();
    })();
    return () => {
      clearTimeout(teto);
      vivo = false;
    };
  }, [presente, liberar, limite]);
}
