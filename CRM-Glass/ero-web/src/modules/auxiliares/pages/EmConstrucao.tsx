import { TPage } from '../../../design-system/kit';
import { ROTULO_CADASTROS } from '../../../shared/sessao';

/**
 * PROVISÓRIA: as 4 telas de auxiliar que ainda não foram copiadas do `TipoCadastroFormList` abrem aqui (etapa E4a do
 * PLANO-PESSOAS). Cada cópia troca a sua rota em `routes.tsx` pela página dela; quando as 4 existirem, este arquivo sai.
 */
export function EmConstrucao({ titulo }: { titulo: string }) {
  return (
    <TPage
      title={titulo}
      breadcrumb={[ROTULO_CADASTROS, 'Auxiliares', titulo]}
      subtitle="Esta tela está em construção e chega na próxima etapa."
      coreografia="formulario"
    >
      {null}
    </TPage>
  );
}
