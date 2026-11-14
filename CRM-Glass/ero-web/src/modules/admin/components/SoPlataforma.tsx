import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { naVisaoDePlataforma, useUsuarioAtual } from '../../../shared/sessao';

/**
 * Telas do grupo Administrativo: só o superadmin na visão de plataforma. Os demais (e o superadmin dentro de um
 * contratante) voltam ao Início. É conforto: quem barra é a API (papel + `exigirVisaoPlataforma`).
 */
export function SoPlataforma({ children }: { children: ReactNode }) {
  const usuario = useUsuarioAtual();
  if (!naVisaoDePlataforma(usuario)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
