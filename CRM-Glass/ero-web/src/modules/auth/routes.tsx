import type { RouteObject } from 'react-router';
import { LoginPage } from './pages/LoginPage';

/** Rotas públicas do módulo de acesso (fora da casca). */
export const rotasAuth: RouteObject[] = [{ path: 'login', element: <LoginPage /> }];
