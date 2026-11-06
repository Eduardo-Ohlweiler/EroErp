import type { ComponentType } from 'react';

/** Item do menu lateral e da barra inferior. A lista vem de `app/menu.ts` (frontend-modulos), já filtrada por permissão. */
export type ItemMenu = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: number;
};

export const isActive = (pathname: string, to: string) =>
  to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);
