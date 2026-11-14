import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { AparenciaProvider } from './shared/aparencia/AparenciaProvider';
import { SessaoProvider } from './shared/sessao';
import { ToastProvider } from './design-system/ui/Toast';
import { TQuestionProvider } from './design-system/kit/useQuestion';
import { LiveBackground } from './motion/cena/LiveBackground';
import { trocarTema } from './motion/cena/trocarTema';
import { aplicarVariaveisDeMovimento } from './motion/tokens';
import { queryClient } from './app/queryClient';
import { roteador } from './app/rotas';
// Plus Jakarta Sans hospedada no app (OFL, @fontsource-variable): sem Google Fonts.
import '@fontsource-variable/plus-jakarta-sans';
import './styles/index.css';

/*
 * Raiz do app. O fundo (vivo ou de cena) fica aqui, fixo por baixo de tudo: vale no login e na casca,
 * e troca de tema em vídeo (trocarTema) e de fundo (esmaecimento cruzado) sem desmontar.
 * A sessão (token em memória, refresh pelo cookie) fica acima do roteador; a aparência do contratante
 * é aplicada pela raiz das rotas (app/Raiz.tsx), na troca de área.
 */
aplicarVariaveisDeMovimento();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AparenciaProvider trocarTema={trocarTema}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {/* A janela de confirmação do kit (useQuestion), uma só para o app. */}
          <TQuestionProvider>
            <SessaoProvider>
              <LiveBackground />
              <div className="relative z-10">
                <RouterProvider router={roteador} />
              </div>
            </SessaoProvider>
          </TQuestionProvider>
        </ToastProvider>
      </QueryClientProvider>
    </AparenciaProvider>
  </StrictMode>,
);
