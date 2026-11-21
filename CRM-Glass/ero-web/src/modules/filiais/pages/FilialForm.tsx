import { TPage } from '../../../design-system/kit';
import { ROTULO_CADASTROS } from '../../../shared/sessao';

/** Provisória (E3): a ficha da filial é a próxima etapa (E4, cópia do modelo Form). Só mantém as rotas de pé. */
export function FilialForm() {
  return (
    <TPage title="Filial" breadcrumb={[ROTULO_CADASTROS, 'Filiais', 'Cadastro']}>
      <p className="text-muted">O cadastro da filial chega na próxima etapa.</p>
    </TPage>
  );
}
