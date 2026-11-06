import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { spring } from '../../motion/tokens';
import { cn } from '../../shared/util/utils';

export type OtpInputProps = {
  valor: string;
  onChange: (v: string) => void;
  /** chamado quando todas as casas estão preenchidas (ex.: enviar sozinho) */
  onCompleto?: (v: string) => void;
  tamanho?: number;
  /** nome do grupo para leitores de tela */
  rotulo?: string;
  invalido?: boolean;
  desabilitado?: boolean;
  autoFocus?: boolean;
  /** vai para a primeira casa (ligação com o rótulo do CampoForm) */
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
};

/**
 * Código de verificação em casas (6 dígitos por padrão).
 * Aceita colar o código inteiro, preenchimento automático do celular (`one-time-code`),
 * setas, Backspace e Delete.
 */
export function OtpInput({
  valor,
  onChange,
  onCompleto,
  tamanho = 6,
  rotulo = 'Código de verificação',
  invalido,
  desabilitado,
  autoFocus,
  id,
  ...aria
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digitos = valor.replace(/\D/g, '').slice(0, tamanho);
  const ruim = invalido || aria['aria-invalid'] === true || aria['aria-invalid'] === 'true';

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const focar = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(tamanho - 1, i))];
    el?.focus();
    el?.select();
  };

  const definir = (novo: string, focoEm?: number) => {
    const limpo = novo.replace(/\D/g, '').slice(0, tamanho);
    onChange(limpo);
    if (focoEm !== undefined) focar(focoEm);
    if (limpo.length === tamanho) onCompleto?.(limpo);
  };

  const digitar = (i: number, texto: string) => {
    const so = texto.replace(/\D/g, '');
    if (!so) return;
    if (so.length > 1) {
      // autopreenchimento ou colagem caindo numa casa: espalha a partir dela
      definir(digitos.slice(0, i) + so, i + so.length);
      return;
    }
    // casa já preenchida: troca o dígito; casa depois do fim: entra no fim (sem buracos)
    const novo = i < digitos.length ? digitos.slice(0, i) + so + digitos.slice(i + 1) : digitos + so;
    definir(novo, Math.min(i, digitos.length) + 1);
  };

  const tecla = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digitos[i]) definir(digitos.slice(0, i) + digitos.slice(i + 1), i);
      else if (i > 0) definir(digitos.slice(0, i - 1) + digitos.slice(i), i - 1);
    } else if (e.key === 'Delete') {
      e.preventDefault();
      definir(digitos.slice(0, i) + digitos.slice(i + 1), i);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focar(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focar(i + 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focar(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focar(digitos.length);
    }
  };

  const colar = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const so = e.clipboardData.getData('text').replace(/\D/g, '');
    if (so) definir(so, Math.min(so.length, tamanho - 1));
  };

  return (
    <div role="group" aria-label={rotulo} aria-describedby={aria['aria-describedby']} className="flex gap-2 sm:gap-2.5">
      {Array.from({ length: tamanho }, (_, i) => {
        const d = digitos[i] ?? '';
        return (
          <motion.input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={i === 0 ? id : undefined}
            value={d}
            onChange={(e) => digitar(i, e.target.value)}
            onKeyDown={(e) => tecla(i, e)}
            onPaste={colar}
            onFocus={(e) => e.target.select()}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={i === 0 ? tamanho : 1}
            disabled={desabilitado}
            aria-label={`Dígito ${i + 1} de ${tamanho}`}
            aria-invalid={ruim || undefined}
            animate={d ? { scale: [0.92, 1] } : { scale: 1 }}
            transition={spring.bouncy}
            className={cn(
              'input !w-11 sm:!w-12 !h-14 !px-0 text-center text-xl font-semibold tabular-nums',
              d && 'border-[color-mix(in_srgb,var(--accent)_45%,transparent)]',
            )}
          />
        );
      })}
    </div>
  );
}
