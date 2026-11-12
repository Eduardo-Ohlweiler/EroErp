import { QueryClient } from '@tanstack/react-query';
import { ErroApi } from '../shared/api/erros';

/** Erro do cliente (4xx) não melhora tentando de novo; rede e 5xx tentam até 2 vezes. */
export function deveRepetir(tentativas: number, erro: unknown) {
  if (erro instanceof ErroApi && erro.status >= 400 && erro.status < 500) return false;
  return tentativas < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: deveRepetir, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});
