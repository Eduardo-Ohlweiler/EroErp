import { Navigate } from 'react-router';
import { podeAbrirTela, useUsuarioAtual } from '../../../shared/sessao';
import { TELAS_AUXILIARES } from '../telas';

/** `/cadastros/auxiliares` sozinha: abre o primeiro auxiliar que o usuário pode abrir (sem nenhum, o Início). */
export function PrimeiroAuxiliar() {
  const usuario = useUsuarioAtual();
  const primeiro = TELAS_AUXILIARES.find((t) => podeAbrirTela(usuario, t.tela, 'contratante'));
  return <Navigate to={primeiro?.to ?? '/'} replace />;
}
