import type { RouteObject } from 'react-router';
import { ExigeTela } from '../../shared/sessao';
import { SoPlataforma } from './components/SoPlataforma';

/*
 * Rotas do Administrativo (dentro da casca), cada uma num pedaço próprio do build (lazy). A guarda vai em cada rota,
 * sem layout com Outlet no meio: a RotaAnimada da casca congela a tela que sai pela rota dela.
 *   /admin/contratantes                 lista                      (SoPlataforma: superadmin na plataforma)
 *   /admin/contratantes/novo            ficha nova (com o administrador inicial)
 *   /admin/contratantes/:id             ficha
 *   /admin/contratantes/:id/aparencia   aparência, com prévia ao vivo
 *   /admin/usuarios                     lista                      (ExigeTela usuario-list, dentro de um contratante)
 *   /admin/usuarios/novo · /:id         ficha                      (ExigeTela usuario-form, dentro de um contratante)
 *   /admin/logs                         trilha de segurança        (ExigeTela auditoria-list, nos dois lugares)
 */
export const rotasAdmin: RouteObject[] = [
  {
    path: 'admin/contratantes',
    lazy: async () => {
      const { ContratanteList } = await import('./pages/ContratanteList');
      return { element: <SoPlataforma><ContratanteList /></SoPlataforma> };
    },
  },
  {
    path: 'admin/contratantes/novo',
    lazy: async () => {
      const { ContratanteForm } = await import('./pages/ContratanteForm');
      return { element: <SoPlataforma><ContratanteForm /></SoPlataforma> };
    },
  },
  {
    path: 'admin/contratantes/:id',
    lazy: async () => {
      const { ContratanteForm } = await import('./pages/ContratanteForm');
      return { element: <SoPlataforma><ContratanteForm /></SoPlataforma> };
    },
  },
  {
    path: 'admin/contratantes/:id/aparencia',
    lazy: async () => {
      const { ContratanteAparencia } = await import('./pages/ContratanteAparencia');
      return { element: <SoPlataforma><ContratanteAparencia /></SoPlataforma> };
    },
  },
  {
    path: 'admin/usuarios',
    lazy: async () => {
      const { UsuarioList } = await import('./pages/UsuarioList');
      return { element: <ExigeTela tela="usuario-list" escopo="contratante"><UsuarioList /></ExigeTela> };
    },
  },
  {
    path: 'admin/usuarios/novo',
    lazy: async () => {
      const { UsuarioForm } = await import('./pages/UsuarioForm');
      return { element: <ExigeTela tela="usuario-form" escopo="contratante"><UsuarioForm /></ExigeTela> };
    },
  },
  {
    path: 'admin/usuarios/:id',
    lazy: async () => {
      const { UsuarioForm } = await import('./pages/UsuarioForm');
      return { element: <ExigeTela tela="usuario-form" escopo="contratante"><UsuarioForm /></ExigeTela> };
    },
  },
  {
    path: 'admin/logs',
    lazy: async () => {
      const { AuditoriaList } = await import('./pages/AuditoriaList');
      return { element: <ExigeTela tela="auditoria-list" escopo="ambos"><AuditoriaList /></ExigeTela> };
    },
  },
];
