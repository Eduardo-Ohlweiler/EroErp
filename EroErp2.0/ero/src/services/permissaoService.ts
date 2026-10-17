import { api } from './api'
import type { CatalogoModulo } from '@/types/permissao'

export const permissaoService = {
  /** Módulos e telas que se libera por usuário, com rótulos. Só SUPERADMIN. */
  catalogo: () => api.get<CatalogoModulo[]>('/permissoes/catalogo').then((r) => r.data),
}
