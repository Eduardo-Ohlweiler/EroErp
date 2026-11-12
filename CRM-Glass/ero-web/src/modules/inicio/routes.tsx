import type { RouteObject } from 'react-router';
import { InicioPage } from './pages/InicioPage';

/** Rotas do Início (dentro da casca). */
export const rotasInicio: RouteObject[] = [{ index: true, element: <InicioPage /> }];
