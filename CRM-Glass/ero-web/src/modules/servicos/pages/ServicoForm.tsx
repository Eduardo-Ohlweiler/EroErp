import { useNavigate } from 'react-router';
import { TButton, TPage, TPanel } from '../../../design-system/kit';
import { ROTULO_CADASTROS } from '../../../shared/sessao';

/**
 * PROVISÓRIO (etapa E4): só para as rotas `/novo` e `/:id` da lista abrirem algo. A etapa E5 substitui este arquivo
 * pelo ServicoForm de verdade (cópia do modelo Form, docs/07 §4.2).
 */
export function ServicoForm() {
  const navigate = useNavigate();
  return (
    <TPage title="Serviço" breadcrumb={[ROTULO_CADASTROS, 'Serviços', 'Cadastro']} coreografia="formulario">
      <TPanel title="Cadastro de serviço">
        <p className="text-muted">A ficha do serviço ainda está em construção.</p>
        <TButton variant="voltar" onClick={() => navigate('/cadastros/servicos')} />
      </TPanel>
    </TPage>
  );
}
