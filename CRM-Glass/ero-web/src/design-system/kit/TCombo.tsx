import { useController } from 'react-hook-form';
import { Combobox, type OpcaoCombobox } from '../ui/Combobox';
import { CampoDoKit, useLigadoAoForm, type PropsDeCampo } from './campo';
import { LARGURA_PADRAO } from './larguras';
import type { OpcaoSelect } from './opcoes';
import { useSomenteLeituraDoForm } from './somenteLeitura';

export type TComboProps = PropsDeCampo & {
  /** opções fixas (situação, tipo, enum); `SITUACAO_OPCOES` está pronto no kit */
  opcoes: OpcaoSelect[];
  /** primeira opção, de valor vazio: "Todas", "Selecione…" */
  vazio?: string;
  /** controlado por quem chama (fora de `TForm`) */
  value?: string;
  onChange?: (valor: string) => void;
  onBlur?: () => void;
  placeholder?: string;
};

/**
 * Combo de **opções fixas** (docs/07 §3.2), sobre o `Combobox` glass (WAI-ARIA, lista em `glass-solid` num
 * portal). O valor é sempre texto; `vazio` vale `''`. O que vem do banco é o `TDBCombo` (ainda não existe).
 */
export function TCombo(props: TComboProps) {
  const ligado = useLigadoAoForm(props.name, props.onChange !== undefined || props.value !== undefined);
  if (ligado) return <TComboLigado {...props} name={props.name!} />;
  return <TComboBase {...props} />;
}

function TComboLigado(props: TComboProps & { name: string }) {
  const { field, fieldState } = useController({ name: props.name });
  return (
    <TComboBase
      {...props}
      value={(field.value as string | null | undefined) ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={props.error ?? fieldState.error?.message}
    />
  );
}

function TComboBase({ label, opcoes, vazio, value, onChange, width, ajuda, error, rotuloOculto, required, disabled, id, placeholder }: TComboProps) {
  // Só leitura do TForm: focável e sem abrir a lista. `disabled` só para campo travado de verdade.
  const somenteLeitura = useSomenteLeituraDoForm();
  const lista: OpcaoCombobox[] = vazio !== undefined ? [{ valor: '', rotulo: vazio }, ...opcoes] : opcoes;
  const valor = value === undefined || (value === '' && vazio === undefined) ? null : value;
  return (
    <CampoDoKit
      kit="TCombo"
      padrao={LARGURA_PADRAO.TCombo}
      label={label}
      width={width}
      ajuda={ajuda}
      error={error}
      rotuloOculto={rotuloOculto}
      required={required}
      id={id}
      semReserva={somenteLeitura || !!disabled}
    >
      {(ids) => (
        <Combobox
          {...ids}
          opcoes={lista}
          valor={valor}
          onChange={(v) => onChange?.(v ?? '')}
          placeholder={placeholder ?? vazio ?? 'Selecione…'}
          limpavel={vazio === undefined && !required}
          invalido={!!error}
          desabilitado={!!disabled}
          somenteLeitura={somenteLeitura}
        />
      )}
    </CampoDoKit>
  );
}
