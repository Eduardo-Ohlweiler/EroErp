/**
 * Espelha o enum `Tela` do backend — o catálogo de telas que se libera por
 * usuário. Cada módulo trazido do EroErp antigo acrescenta as suas aqui e lá.
 */
export type Tela = 'PESSOAS' | 'FILIAIS' | 'SERVICOS'

/** Espelha `NivelAcesso`. "Sem acesso" não é valor: é a tela não aparecer. */
export type NivelAcesso = 'LEITURA' | 'ESCRITA'

/** Tela → nível, já resolvido pelo servidor (ADMIN e SUPERADMIN vêm com tudo). */
export type Permissoes = Partial<Record<Tela, NivelAcesso>>

/** Espelha `PermissaoDto`: uma tela liberada, como gravada no usuário. */
export interface Permissao {
  tela: Tela
  nivel: NivelAcesso
}

/** Espelha `CatalogoModuloDto`. */
export interface CatalogoModulo {
  modulo: string
  rotulo: string
  telas: { tela: Tela; rotulo: string }[]
}
