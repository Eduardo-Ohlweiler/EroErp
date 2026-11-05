import { useReduce, useSettings } from '../../theme/settings';
import { cn } from '../../lib/utils';
import { SceneBackground } from './SceneBackground';
import { CENAS } from './cenas';

/** Fundo vivo: o vidro só fica bonito quando tem algo com cor e profundidade atrás. */
export function LiveBackground() {
  const { settings } = useSettings();
  const reduce = useReduce();
  const cena = CENAS.find((c) => c.id === settings.fundo);
  if (cena) {
    // Cena fotográfica: o shader já faz vinheta e grão; o brilho de destaque tingiria a foto.
    return (
      <div className="live-bg" aria-hidden>
        <SceneBackground key={cena.id} cena={cena} />
      </div>
    );
  }
  return (
    <div className={cn('live-bg', (!settings.fundoAnimado || reduce) && 'paused')} aria-hidden>
      <div className="base" />
      {settings.fundo === 'orbs' && (
        <>
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </>
      )}
      {settings.fundo === 'aurora' && (
        <>
          <div className="aurora" />
          <div className="aurora aurora-2" />
        </>
      )}
      {settings.fundo === 'ondas' && <Waves />}
      <div className="vignette" />
      <div className="noise" />
    </div>
  );
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
