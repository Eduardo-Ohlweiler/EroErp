/** Sessão do usuário (token em memória, refresh pelo cookie, estados) e o `?voltar=` do login. */
export { SessaoProvider, UsuarioDaCascaProvider, useSessao, useUsuarioAtual, useUsuarioDaCasca, type SessaoCtx } from './SessaoProvider';
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
export {
  dentroDoEscopo,
  ehAdministrador,
  naVisaoDePlataforma,
  nomeDoContratante,
  podeAbrirTela,
  ROTULO_ADMINISTRATIVO,
  rotuloDoPapel,
  type EscopoDaTela,
} from './rotulos';
