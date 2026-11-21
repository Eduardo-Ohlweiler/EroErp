import { forwardRef, useRef, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { useController } from 'react-hook-form';
import { Input } from '../ui/Bits';
import { InputSenha } from '../ui/InputSenha';
import { cn } from '../../shared/util/utils';
import { CampoDoKit, useLigadoAoForm, type PropsDeCampo } from './campo';
import {
  aplicarMascara,
  larguraPadraoDoEntry,
  TAMANHO_MAXIMO,
  teclado,
  valorCompleto,
  valorParaExibir,
  valorParaGravar,
  type Mascara,
} from './mascaras';
import { useSomenteLeituraDoForm } from './somenteLeitura';

export type TEntryProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'width' | 'required' | 'disabled' | 'size'> &
  PropsDeCampo & {
    /** `cpf`, `cnpj` (alfanumérico), `cpfCnpj`, `telefone`, `celular`, `cep`, `cnh` (11 dígitos, sem pontuação), `hora`, `moeda`, `decimal`, `inteiro`, `decimalComSinal` */
    mascara?: Mascara;
    /** casas decimais (ignorado em `inteiro`; padrão 2) */
    casas?: number;
    /** unidade à direita ("kg", "%") */
    suffix?: ReactNode;
    /**
     * Botão colado ao campo, na altura dele (como o `acao` do `TDBCombo`): o "Gerar" da senha temporária
     * (`<TButton variant="secondary" label="Gerar" …/>`). Some em só leitura.
     */
    acao?: ReactNode;
    /**
     * Chamado com o valor cru quando a máscara fica completa ao digitar ou colar (CEP com 8 dígitos, CPF com 11,
     * CNPJ com 14, celular com 11, CNH com 11): é a consulta do CEP. Uma vez por valor completo; apagar um dígito e completar de
     * novo chama outra vez. Vem depois do `onChange`: o formulário já tem o valor novo.
     */
    onCompletar?: (cru: string) => void;
  };

/**
 * Campo de texto do kit (docs/07 §3.2), sobre o `Input` (ou o `InputSenha` com `type="password"`).
 *
 * Dentro de um `TForm`, basta o `name`: valor, erro e `onBlur` vêm do formulário. Fora dele (ou com
 * `value`/`onChange`), é um input controlado comum.
 *
 * A máscara mora aqui, não no `onChange` da tela: o componente reescreve `e.target.value` antes de repassar o
 * evento. Documento, CEP e telefone ligados ao formulário gravam cru (o CNPJ alfanumérico em maiúsculas); as
 * numéricas gravam o texto da máscara ("72,50"), que o `paraCorpo` converte com `paraNumero`.
 */
export const TEntry = forwardRef<HTMLInputElement, TEntryProps>(function TEntry(props, ref) {
  const ligado = useLigadoAoForm(props.name, props.onChange !== undefined || props.value !== undefined);
  if (ligado) return <TEntryLigado {...props} name={props.name!} />;
  return <TEntryBase {...props} ref={ref} />;
});

function TEntryLigado(props: TEntryProps & { name: string }) {
  const { field, fieldState } = useController({ name: props.name });
  return (
    <TEntryBase
      {...props}
      ref={field.ref}
      value={valorParaExibir(props.mascara, field.value)}
      onChange={(e) => field.onChange(valorParaGravar(props.mascara, e.target.value))}
      onBlur={field.onBlur}
      error={props.error ?? fieldState.error?.message}
    />
  );
}

const TEntryBase = forwardRef<HTMLInputElement, TEntryProps>(function TEntryBase(
  { label, error, suffix, ajuda, mascara, casas, width, rotuloOculto, required, disabled, className, id, onChange, type, readOnly, acao, onCompletar, ...rest },
  ref,
) {
  // Só leitura do TForm: readOnly (focável, o leitor de tela lê o valor). `disabled` só para campo travado de verdade.
  const somenteLeitura = useSomenteLeituraDoForm() || !!readOnly;

  // O último valor completo avisado: o onCompletar não repete para o mesmo CEP (nem a cada tecla que não muda nada).
  const avisado = useRef<string | null>(null);
  const aoDigitar = !mascara
    ? onChange
    : (e: ChangeEvent<HTMLInputElement>) => {
        const colou = (e.nativeEvent as InputEvent).inputType === 'insertFromPaste';
        e.target.value = aplicarMascara(mascara, e.target.value, { casas, colou });
        onChange?.(e);
        const completo = valorCompleto(mascara, e.target.value);
        if (completo !== null && completo !== avisado.current) onCompletar?.(completo);
        avisado.current = completo;
      };

  const doc = mascara === 'cnpj' || mascara === 'cpfCnpj';
  const comum: InputHTMLAttributes<HTMLInputElement> & { ref: typeof ref } = {
    ...rest,
    ref,
    onChange: aoDigitar,
    disabled: !!disabled,
    readOnly: somenteLeitura,
    'aria-readonly': somenteLeitura || undefined,
    'aria-required': (required && !somenteLeitura) || undefined,
    maxLength: rest.maxLength ?? (mascara ? TAMANHO_MAXIMO[mascara] : undefined),
    inputMode: rest.inputMode ?? (type === 'email' ? 'email' : teclado(mascara)),
    ...(type === 'email' || doc ? { spellCheck: false } : {}),
    ...(type === 'email' ? { autoCapitalize: 'off' } : {}),
    ...(doc ? { autoCapitalize: 'characters' } : {}),
  };

  const moeda = mascara === 'moeda';
  return (
    <CampoDoKit
      kit="TEntry"
      padrao={larguraPadraoDoEntry(mascara)}
      mascara={mascara}
      label={label}
      width={width}
      ajuda={ajuda}
      error={error}
      rotuloOculto={rotuloOculto}
      required={required}
      id={id}
      semReserva={somenteLeitura || !!disabled}
    >
      {(ids) => {
        const controle =
          type === 'password' ? (
            <InputSenha icon={null} autoComplete="new-password" invalid={!!error} {...comum} {...ids} className={className} />
          ) : (
            <div className="relative">
              <Input
                type={type}
                invalid={!!error}
                right={suffix ? <span className="px-2 text-xs text-subtle">{suffix}</span> : undefined}
                {...comum}
                {...ids}
                className={cn(moeda && 'pl-10', mascara && 'tabular-nums', className)}
              />
              {moeda && (
                <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-xs text-subtle">
                  R$
                </span>
              )}
            </div>
          );
        if (!acao || somenteLeitura) return controle;
        return (
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">{controle}</div>
            <div className="flex h-11 shrink-0 items-center">{acao}</div>
          </div>
        );
      }}
    </CampoDoKit>
  );
});
