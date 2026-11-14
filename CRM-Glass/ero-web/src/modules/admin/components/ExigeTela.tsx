import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { podeAbrirTela, useUsuarioAtual, type EscopoDaTela } from '../../../shared/sessao';

/**
 * Telas com grupo de liberação (Usuários, Logs): sem a tela nas `telas` do `GET /api/auth/eu`, ou fora do escopo
 * (Usuários com o superadmin na plataforma), volta ao Início, como o `SoPlataforma`. Conforto: quem barra é a API.
 */
export function ExigeTela({ tela, escopo, children }: { tela: string; escopo: EscopoDaTela; children: ReactNode }) {
  const usuario = useUsuarioAtual();
  if (!podeAbrirTela(usuario, tela, escopo)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
