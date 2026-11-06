import { forwardRef, useState, type ComponentType, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from './Bits';

export type InputSenhaProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  invalid?: boolean;
  /** ícone à esquerda (padrão: cadeado); `null` tira o ícone */
  icon?: ComponentType<{ className?: string }> | null;
};

/**
 * Campo de senha com botão de mostrar/ocultar. Funciona com `register` do React Hook Form (forwardRef).
 * Use `autoComplete="current-password"` no login e `"new-password"` na troca.
 */
export const InputSenha = forwardRef<HTMLInputElement, InputSenhaProps>(function InputSenha(
  { icon = Lock, autoComplete = 'current-password', ...rest },
  ref,
) {
  const [visivel, setVisivel] = useState(false);
  return (
    <Input
      ref={ref}
      type={visivel ? 'text' : 'password'}
      icon={icon ?? undefined}
      autoComplete={autoComplete}
      spellCheck={false}
      autoCapitalize="off"
      right={
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visivel}
          className="size-8 rounded-[10px] grid place-items-center text-subtle hover:text-fg hover:bg-[var(--chip)] transition-colors"
        >
          {visivel ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
      {...rest}
    />
  );
});
