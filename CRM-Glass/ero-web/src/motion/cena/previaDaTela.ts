import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useIsPresent } from 'motion/react';
import { useAparencia, type AparenciaApi } from '../../shared/aparencia/AparenciaProvider';
import { useAntesDaProximaTela } from '../coreografia/saida';
import { aguardarCorteDaTroca } from './trocarTema';

/**
 * Prévia ao vivo de uma tela (ex.: Aparência do contratante): a interface inteira mostra `valor` enquanto
 * a tela está presente. Substitui o `useEffect(() => { definirPrevia(valor); return limparPrevia }, [valor])`.
 *
 * Saída, nesta ordem (nada da prévia vaza para a tela seguinte):
 *   1. a tela se desmonta em blocos, ainda com a prévia (destaque, tema e fundo do contratante);
 *   2. `limparPrevia()`;
 *   3. a troca de tema em vídeo volta ao tema de antes (cena + esmaecimento, ou revelação circular), se o tema mudou;
 *      destaque e fundo voltam junto (o fundo em esmaecimento cruzado);
 *   4. a próxima tela monta junto com o fim da revelação (`cena.corteDaSaida`), já com a aparência de volta:
 *      a interface já está no tema novo e a captura da View Transition já foi feita (sem blocos duplicados).
 *      Sem mudança de tema (ou com movimento reduzido), monta logo depois da limpeza.
 * Se a tela for desmontada de outro jeito (área inteira saindo sem AnimatePresence, erro), o cleanup limpa a prévia.
 *
 *   function ContratanteAparencia() {
 *     const [valor, setValor] = useState<AparenciaApi>(…);
 *     usePreviaDaTela(valor);
 *     …
 *   }
 *
 * `valor` nulo ou indefinido (carregando) não mexe na prévia.
 */
export function usePreviaDaTela(valor: Partial<AparenciaApi> | null | undefined) {
  const { definirPrevia, limparPrevia } = useAparencia();
  const presente = useIsPresent();

  // Enquanto presente, a interface acompanha o valor. Saindo, para de acompanhar (a tela está congelada).
  // Compara pelo conteúdo: um objeto novo com os mesmos valores (literal no render) não reaplica a prévia.
  const ultimo = useRef(valor);
  ultimo.current = valor;
  const conteudo = valor ? JSON.stringify(valor) : null;
  useEffect(() => {
    if (presente && ultimo.current) definirPrevia(ultimo.current);
  }, [presente, conteudo, definirPrevia]);

  // Desmontou de qualquer jeito: a prévia não fica.
  const limpar = useRef(limparPrevia);
  limpar.current = limparPrevia;
  useEffect(() => () => limpar.current(), []);

  useAntesDaProximaTela(async () => {
    // flushSync: o provider recalcula o tema e chama a troca em vídeo agora (efeito de render síncrono roda
    // antes de flushSync voltar), então `aguardarCorteDaTroca` já enxerga a troca em andamento.
    flushSync(() => limpar.current());
    await aguardarCorteDaTroca();
  });
}
