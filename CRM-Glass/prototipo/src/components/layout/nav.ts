import { Building2, CalendarDays, Kanban, LayoutDashboard, Package, Palette, Settings, Users } from 'lucide-react';

export const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/funil', label: 'Funil de vendas', icon: Kanban },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, badge: 5 },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/filiais', label: 'Filiais', icon: Building2 },
  { to: '/produtos', label: 'Produtos', icon: Package },
];

export const NAV_BOTTOM = [
  { to: '/design-system', label: 'Design system', icon: Palette },
  { to: '/configuracoes', label: 'Aparência', icon: Settings },
];

export const isActive = (pathname: string, to: string) =>
  to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);

export function titleFor(pathname: string) {
  if (pathname.startsWith('/clientes/')) return 'Ficha do cliente';
  return [...NAV, ...NAV_BOTTOM].find((n) => isActive(pathname, n.to))?.label ?? 'Dashboard';
}
