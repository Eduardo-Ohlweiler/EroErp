import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { DEALS, type Deal, type Etapa } from './data/mock';

type Store = {
  deals: Deal[];
  moveDeal: (id: string, etapa: Etapa) => void;
  addDeal: (d: Deal) => void;
  paletteOpen: boolean;
  setPaletteOpen: Dispatch<SetStateAction<boolean>>;
  newDealOpen: boolean;
  setNewDealOpen: Dispatch<SetStateAction<boolean>>;
};

const StoreCtx = createContext<Store | null>(null);

/** Estado em memória do protótipo (some ao recarregar a página). */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>(DEALS);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [newDealOpen, setNewDealOpen] = useState(false);

  const moveDeal = (id: string, etapa: Etapa) =>
    setDeals((ds) => {
      const d = ds.find((x) => x.id === id);
      if (!d || d.etapa === etapa) return ds;
      const moved = { ...d, etapa, prob: etapa === 'ganho' ? 100 : d.prob };
      return [moved, ...ds.filter((x) => x.id !== id)];
    });
  const addDeal = (d: Deal) => setDeals((ds) => [d, ...ds]);

  return (
    <StoreCtx.Provider value={{ deals, moveDeal, addDeal, paletteOpen, setPaletteOpen, newDealOpen, setNewDealOpen }}>
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('StoreProvider ausente');
  return c;
}
