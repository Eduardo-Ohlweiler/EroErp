/** Sessão do usuário (token em memória, refresh pelo cookie, estados) e o `?voltar=` do login. */
export { SessaoProvider, UsuarioDaCascaProvider, useSessao, useUsuarioAtual, type SessaoCtx } from './SessaoProvider';
export {
  estadoDoUsuario,
  identidadeDoUsuario,
  reduzirSessao,
  trocouIdentidade,
  usuarioDoEstado,
  type EstadoSessao,
  type MotivoAnonimo,
} from './estado';
export { ehCaminhoInterno, rotaDoLogin, sanitizarVoltar } from './voltar';
export { nomeDoContratante, rotuloDoPapel } from './rotulos';
