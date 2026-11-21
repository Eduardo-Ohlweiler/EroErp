import { TPage } from '../../../design-system/kit';
import { ROTULO_CADASTROS } from '../../../shared/sessao';

/**
 * PROVISÓRIO (etapa E2): só existe para a rota lazy de `routes.tsx` resolver. A etapa E4 substitui este arquivo pela
 * cópia do modelo FormList (TipoCadastroFormList), com `api/profissoes.ts` e `schemas/profissao.ts`.
 */
export function ProfissaoFormList() {
  return <TPage title="Profissões" breadcrumb={[ROTULO_CADASTROS, 'Auxiliares', 'Profissões']}>{null}</TPage>;
}
