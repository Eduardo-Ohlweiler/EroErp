import { useController } from 'react-hook-form';
import { Combobox, type OpcaoCombobox } from '../ui/Combobox';
import { CampoDoKit, useLigadoAoForm, type PropsDeCampo } from './campo';
import { larguraEstreita } from './larguras';
import { larguraDoCombo, maiorRotulo, rotuloInativo, type OpcaoSelect } from './opcoes';
import { useSomenteLeituraDoForm } from './somenteLeitura';

/**
 * Uma opção do `TCombo`. `inativo` é o valor **já gravado** no registro que deixou de valer (tipo inativado): o combo
 * mostra "Nome (inativo)" e mede a largura com ele. Quem monta as opções põe só os ativos mais os inativos gravados.
 */
export type OpcaoCombo = OpcaoSelect & { inativo?: boolean };

export type TComboProps = PropsDeCampo & {
  /** opções fixas (situação, tipo, enum) ou carregadas do banco; `SITUACAO_OPCOES` está pronto no kit */
  opcoes: OpcaoCombo[];
  /** primeira opção, de valor vazio: "Todas", "Selecione…" */
  vazio?: string;
  /** controlado por quem chama (fora de `TForm`) */
  value?: string;
  onChange?: (valor: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  /** foca o campo ao montar, sem abrir a lista: o primeiro campo do formulário (`autoFocus={!somenteLeitura}`) */
  autoFocus?: boolean;
};

/** As opções como o `Combobox` as mostra: o inativo gravado com " (inativo)", o `vazio` na frente. Função pura. */
export function opcoesDoTCombo(opcoes: OpcaoCombo[], vazio?: string): OpcaoCombobox[] {
  const lista = opcoes.map((o) => ({ valor: o.valor, rotulo: o.inativo ? rotuloInativo(o.rotulo) : o.rotulo }));
  return vazio !== undefined ? [{ valor: '', rotulo: vazio }, ...lista] : lista;
}

/**
 * Combo de opções (docs/07 §3.2), sobre o `Combobox` glass (WAI-ARIA, lista em `glass-flutuante` num portal). O valor é
 * sempre texto; `vazio` vale `''`. Busca no servidor a cada termo é o `TDBCombo`.
 *
 * **Largura automática** (sem `width`, dentro de `TRow`): pelo maior rótulo das opções com o `vazio`, até 18
 * caracteres `situacao`, até 36 `medio`, acima `metade` (`larguraDoCombo`). Com as opções vindas do banco, a largura
 * acompanha o maior nome cadastrado.
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

function TComboBase({ label, opcoes, vazio, value, onChange, width, ajuda, error, rotuloOculto, required, disabled, id, placeholder, autoFocus }: TComboProps) {
  // Só leitura do TForm: focável e sem abrir a lista. `disabled` só para campo travado de verdade.
  const somenteLeitura = useSomenteLeituraDoForm();
  const lista = opcoesDoTCombo(opcoes, vazio);
  const rotuloMax = maiorRotulo(lista);
  const valor = value === undefined || (value === '' && vazio === undefined) ? null : value;
  return (
    <CampoDoKit
      kit="TCombo"
      padrao={larguraDoCombo(rotuloMax)}
      label={label}
      width={width}
      ajuda={ajuda}
      error={error}
      rotuloOculto={rotuloOculto}
      required={required}
      id={id}
      semReserva={somenteLeitura || !!disabled}
      rotuloMax={rotuloMax}
    >
      {(ids) => (
        <Combobox
          {...ids}
          opcoes={lista}
          valor={valor}
          onChange={(v) => onChange?.(v ?? '')}
          placeholder={placeholder ?? vazio ?? 'Selecione…'}
          limpavel={vazio === undefined && !required && !larguraEstreita(width)}
          invalido={!!error}
          desabilitado={!!disabled}
          somenteLeitura={somenteLeitura}
          autoFocus={autoFocus}
        />
      )}
    </CampoDoKit>
  );
}
