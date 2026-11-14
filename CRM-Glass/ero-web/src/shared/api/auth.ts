import { api } from './cliente';
import { usuarioLogadoSchema, type TemaApi, type UsuarioLogado } from './tipos';

/** Rotas de sessão usadas pela casca inteira (o login em si fica em modules/auth/api). */
export const sessaoApi = {
  /** `POST /api/auth/refresh` (cookie + X-Ero-Refresh). Uma por vez; guarda o token novo. */
  renovar: () => api.renovar(),

  /** `GET /api/auth/eu`: quem está logado, telas, permissões e aparência do contratante. */
  eu: (): Promise<UsuarioLogado> => api.requisitar('/api/auth/eu', { schema: usuarioLogadoSchema }),

  /** `PUT /api/auth/eu/tema` → 204. `null` volta a seguir o tema padrão do contratante. */
  trocarTema: (tema: TemaApi | null): Promise<void> =>
    api.requisitar<void>('/api/auth/eu/tema', { metodo: 'PUT', corpo: { tema } }),

  /** `POST /api/auth/logout` (cookie + X-Ero-Refresh) → 204. */
  sair: (): Promise<void> => api.requisitar<void>('/api/auth/logout', { metodo: 'POST', publica: true, refresh: true }),
};
