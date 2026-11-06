import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useReduce, useSettings } from '../../shared/aparencia/AparenciaProvider';
import { cn } from '../../shared/util/utils';
import { blocoReduzido, camadaFundo, cena as tempos } from '../tokens';
import { SceneBackground } from './SceneBackground';
import { quandoOcioso, reservarCanvas } from './canvasReserva';
import { CENAS, CENAS_EXCLUSIVAS, type Cena } from './cenas';
import { useFundoPausado } from './pausaFundo';

/**
 * Fundo vivo: o vidro só fica bonito quando tem algo com cor e profundidade atrás.
 * Montado uma vez na raiz (main.tsx): vale no login e na casca.
 *
 * Diferença do protótipo: a troca de fundo (contratante novo, prévia da Configuração) é um esmaecimento
 * cruzado entre camadas, em vez de um corte. A camada nova entra por cima; a antiga sai depois
 * (motion/tokens.ts, `fundo`). Cada camada é igual ao fundo do protótipo.
 */
export function LiveBackground() {
  const { settings } = useSettings();
  const reduce = useReduce();
  const { fundo, cena } = useFundoResolvido(settings.fundo);
  const vidro = cena?.vidro;
  // Canvas WebGL reservado em tempo ocioso (canvasReserva.ts): a cena do contratante nasce sem criar contexto
  // no quadro em que a casca monta.
  useEffect(() => quandoOcioso(reservarCanvas, tempos.aquecerGpu), []);
  useEffect(() => {
    // Cena com cores fortes pede cartões mais opacos (tokens.css, [data-vidro='denso']).
    const root = document.documentElement;
    if (vidro) root.dataset.vidro = vidro;
    else delete root.dataset.vidro;
  }, [vidro]);

  // Revelação circular do tema em andamento (trocarTema.ts): orbs, aurora e ondas param por baixo do clip-path.
  const pausadoNaTroca = useFundoPausado();
  // Fundo vivo usa o destaque (orbs, aurora, ondas): cada camada guarda o destaque com que nasceu e a troca
  // de destaque vira esmaecimento cruzado, sem salto de cor num quadro. A cena não usa o destaque.
  const chave = cena ? fundo : `${fundo}:${settings.accent}`;

  return (
    <div className={cn('live-bg', (!settings.fundoAnimado || reduce || pausadoNaTroca) && 'paused')} aria-hidden>
      <AnimatePresence initial={false}>
        <motion.div
          key={chave}
          data-accent={settings.accent}
          className={cn('live-bg-camada', !cena && 'live-bg-camada-viva')}
          variants={reduce ? blocoReduzido : camadaFundo}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          {cena ? (
            // Cena fotográfica: o shader já faz vinheta e grão; o brilho de destaque tingiria a foto.
            <SceneBackground cena={cena} />
          ) : (
            <>
              <div className="base" />
              {fundo === 'orbs' && (
                <>
                  <div className="orb orb-1" />
                  <div className="orb orb-2" />
                  <div className="orb orb-3" />
                </>
              )}
              {fundo === 'aurora' && (
                <>
                  <div className="aurora" />
                  <div className="aurora aurora-2" />
                </>
              )}
              {fundo === 'ondas' && <Waves />}
              <div className="vignette" />
              <div className="noise" />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Fundo a mostrar agora. Cena pública: na hora. Cena exclusiva: carrega o pedaço dela e, enquanto isso,
 * mantém o fundo anterior na tela (a troca acontece quando a cena chega, com o mesmo esmaecimento).
 */
function useFundoResolvido(pedido: string): { fundo: string; cena: Cena | undefined } {
  const publica = CENAS.find((c) => c.id === pedido);
  const exclusiva = !publica && pedido in CENAS_EXCLUSIVAS;
  const [carregada, setCarregada] = useState<Cena | null>(null);
  useEffect(() => {
    if (!exclusiva) return;
    let vivo = true;
    CENAS_EXCLUSIVAS[pedido]()
      .then((c) => vivo && setCarregada(c))
      .catch(() => {
        /* sem a cena: fica o fundo anterior */
      });
    return () => {
      vivo = false;
    };
  }, [pedido, exclusiva]);
  const cena = publica ?? (carregada?.id === pedido ? carregada : undefined);
  const mostrado = useRef<{ fundo: string; cena: Cena | undefined }>({ fundo: pedido, cena });
  if (!exclusiva || cena) mostrado.current = { fundo: pedido, cena };
  return mostrado.current;
}

export function Waves() {
  return (
    <svg className="waves" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="wv1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--accent)' }} />
          <stop offset="1" style={{ stopColor: 'var(--accent-2)' }} />
        </linearGradient>
        <linearGradient id="wv2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--accent-2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--accent-3)', stopOpacity: 0.5 }} />
        </linearGradient>
      </defs>
      <g className="wave-1">
        <path d="M-120 640 C 280 380, 760 900, 1560 300 L 1560 1040 L -120 1040 Z" fill="url(#wv1)" opacity="0.5" />
        <path d="M-120 640 C 280 380, 760 900, 1560 300" fill="none" stroke="white" strokeOpacity="0.28" strokeWidth="1.5" />
      </g>
      <g className="wave-2">
        <path d="M-120 210 C 420 -20, 920 540, 1560 120 L 1560 -140 L -120 -140 Z" fill="url(#wv2)" opacity="0.42" />
        <path d="M-120 210 C 420 -20, 920 540, 1560 120" fill="none" stroke="white" strokeOpacity="0.22" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
