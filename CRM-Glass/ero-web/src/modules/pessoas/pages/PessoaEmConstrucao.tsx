import { TPage } from '../../../design-system/kit';
import { ROTULO_CADASTROS } from '../../../shared/sessao';

/**
 * PROVISÓRIA: `/cadastros/pessoas/novo` e `/:id` abrem aqui até a etapa E4b (PessoaForm, cópia do modelo Form). Quando o
 * PessoaForm existir, `routes.tsx` troca a página e este arquivo sai.
 */
export function PessoaEmConstrucao() {
  return (
    <TPage
      title="Pessoa"
      breadcrumb={[ROTULO_CADASTROS, 'Pessoas', 'Ficha']}
      subtitle="A ficha da pessoa está em construção e chega na próxima etapa."
      coreografia="formulario"
    >
      {null}
    </TPage>
  );
}
