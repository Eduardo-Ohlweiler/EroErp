import { createContext, useContext, type ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
import { CampoForm, type IdsCampo } from '../ui/CampoForm';
import { useLargura, type Largura } from './larguras';
import { useSomenteLeituraDoForm } from './somenteLeitura';

/** O que todo campo do kit aceita, além do próprio (docs/07 §3.2). Mesmos nomes do kit do 2.0. */
export type PropsDeCampo = {
  /** dentro de `TForm`, liga o campo ao formulário (valor, erro, onBlur): o caminho do DTO (`administrador.email`) */
  name?: string;
  label: string;
  /** token da escala — só quando a largura padrão do componente não serve */
  width?: Largura;
  ajuda?: ReactNode;
  /** erro vindo de fora (sem ele, o do formulário) */
  error?: string;
  /** rótulo só para leitor de tela (label ao lado, §5) */
  rotuloOculto?: boolean;
  /** põe o `*` no rótulo e `aria-required`; a validação continua sendo do schema */
  required?: boolean;
  disabled?: boolean;
  /** id do controle (label ao lado passa o mesmo id ao `TRotulo`); sem ele, é gerado */
  id?: string;
};

/**
 * Reserva a linha do erro embaixo do campo (o erro aparece sem empurrar o formulário). Só o `TForm` que valida
 * (tem `resolver`) liga; filtros e campos soltos não reservam (F6).
 */
export const ReservaErroDoForm = createContext(false);

/**
 * Dentro de um `TForm`, o campo se liga ao formulário pelo `name` — a não ser que receba `value`/`onChange`:
 * aí quem chama controla.
 */
export function useLigadoAoForm(name: string | undefined, controlado: boolean): boolean {
  const form = useFormContext();
  return !!form && !!name && !controlado;
}

/**
 * Casca de todo campo do kit: o `CampoForm` (rótulo em cima, ajuda, erro animado, bloco da montagem) com a
 * largura da escala e os atributos que o `medir-campos.mjs` lê (docs/07 §7.1), no mesmo `div` de fora.
 */
export function CampoDoKit({
  kit,
  padrao,
  mascara,
  label,
  width,
  ajuda,
  error,
  rotuloOculto,
  required,
  id,
  semReserva,
  grupo,
  ariaGrupo,
  dicas,
  rotuloMax,
  children,
}: Omit<PropsDeCampo, 'name' | 'disabled'> & {
  kit: string;
  padrao: Largura | 'conteudo';
  mascara?: string;
  /** dicas das opções do grupo (`dicasDasOpcoes`): entram depois da `ajuda`, visíveis embaixo do grupo */
  dicas?: string[];
  /** maior rótulo das opções, em caracteres: vira `data-rotulo-max` (o `TCombo` emite; o medidor lê) */
  rotuloMax?: number;
  /** não reserva a linha do erro: campo só leitura (auditoria), travado, ou grupo de rádio/caixas (que nunca reserva) */
  semReserva?: boolean;
  grupo?: boolean | 'radiogroup';
  /** estado do grupo para o leitor de tela (só leitura, obrigatório, inválido) */
  ariaGrupo?: { 'aria-readonly'?: boolean; 'aria-required'?: boolean; 'aria-invalid'?: boolean };
  children: (ids: IdsCampo) => ReactNode;
}) {
  const { largura, classe } = useLargura(width, padrao);
  // Em TForm somenteLeitura não se digita: sem o `*` de obrigatório, sem a dica de preenchimento, sem reserva de erro.
  const somenteLeitura = useSomenteLeituraDoForm();
  const reservar = useContext(ReservaErroDoForm) && !semReserva && !somenteLeitura;
  const temDicas = !!dicas && dicas.length > 0;
  const ajudaComDicas = temDicas ? (
    <>
      {ajuda}
      {ajuda ? ' ' : null}
      {dicas.join(' ')}
    </>
  ) : (
    ajuda
  );
  return (
    <CampoForm
      rotulo={label}
      erro={error}
      dica={somenteLeitura ? undefined : ajudaComDicas}
      id={id}
      obrigatorio={required && !somenteLeitura}
      rotuloOculto={rotuloOculto}
      reservarErro={reservar}
      grupo={grupo}
      ariaGrupo={ariaGrupo}
      dicaLarga
      className={classe}
      dados={{
        'data-kit': kit,
        'data-largura': largura,
        'data-mascara': mascara,
        'data-rotulo-max': rotuloMax === undefined ? undefined : String(rotuloMax),
      }}
    >
      {children}
    </CampoForm>
  );
}
