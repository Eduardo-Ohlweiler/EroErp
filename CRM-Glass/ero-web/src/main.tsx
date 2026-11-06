import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AparenciaProvider } from './shared/aparencia/AparenciaProvider';
import { ToastProvider } from './design-system/ui/Toast';
import { LiveBackground } from './motion/cena/LiveBackground';
import { trocarTema } from './motion/cena/trocarTema';
import { aplicarVariaveisDeMovimento } from './motion/tokens';
import { roteador } from './app/rotas';
import './styles/index.css';

/*
 * Raiz do app. O fundo (vivo ou de cena) fica aqui, fixo por baixo de tudo: vale no login e na casca,
 * e troca de tema em vídeo (trocarTema) e de fundo (esmaecimento cruzado) sem desmontar.
 * O frontend-modulos completa (sessão, QueryClient, casca, telas) a partir daqui.
 */
aplicarVariaveisDeMovimento();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AparenciaProvider trocarTema={trocarTema}>
      <ToastProvider>
        <LiveBackground />
        <div className="relative z-10">
          <RouterProvider router={roteador} />
        </div>
      </ToastProvider>
    </AparenciaProvider>
  </StrictMode>,
);
