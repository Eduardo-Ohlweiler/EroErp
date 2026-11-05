import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';

export type Theme = 'dark' | 'light';
export type Accent = 'violeta' | 'azul' | 'laranja' | 'esmeralda' | 'rosa' | 'ambar';
export type Fundo = 'orbs' | 'aurora' | 'ondas' | 'minimo' | 'escritorio';
export type Movimento = 'completa' | 'reduzida';

export type Settings = {
  theme: Theme;
  accent: Accent;
  fundo: Fundo;
  fundoAnimado: boolean;
  blur: number;
  movimento: Movimento;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  accent: 'violeta',
  fundo: 'orbs',
  fundoAnimado: true,
  blur: 12,
  movimento: 'completa',
};

const KEY = 'vitrum:settings';

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* armazenamento indisponível: usa o padrão */
  }
  return DEFAULT_SETTINGS;
}

type Ctx = { settings: Settings; set: (p: Partial<Settings>) => void; reset: () => void };
const SettingsCtx = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.accent = settings.accent;
    root.style.setProperty('--blur', `${settings.blur}px`);
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* ignora */
    }
  }, [settings]);

  const value: Ctx = {
    settings,
    set: (p) => setSettings((s) => ({ ...s, ...p })),
    reset: () => setSettings(DEFAULT_SETTINGS),
  };

  return (
    <SettingsCtx.Provider value={value}>
      <MotionConfig reducedMotion={settings.movimento === 'reduzida' ? 'always' : 'user'}>{children}</MotionConfig>
    </SettingsCtx.Provider>
  );
}

export function useSettings() {
  const c = useContext(SettingsCtx);
  if (!c) throw new Error('SettingsProvider ausente');
  return c;
}

/** true quando o sistema pede menos movimento ou o usuário escolheu "reduzida". */
export function useReduce() {
  const sys = useReducedMotion();
  const { settings } = useSettings();
  return !!sys || settings.movimento === 'reduzida';
}
