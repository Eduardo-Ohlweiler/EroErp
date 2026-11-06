import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AparenciaProvider } from './shared/aparencia/AparenciaProvider';
import { ToastProvider } from './design-system/ui/Toast';
import { roteador } from './app/rotas';
import './styles/index.css';

/*
 * Base mínima do glass-design-system. O frontend-modulos completa (sessão, QueryClient, casca, telas)
 * e o motion-designer liga a troca de tema em vídeo: <AparenciaProvider trocarTema={trocarTema}>.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AparenciaProvider>
      <ToastProvider>
        <RouterProvider router={roteador} />
      </ToastProvider>
    </AparenciaProvider>
  </StrictMode>,
);
