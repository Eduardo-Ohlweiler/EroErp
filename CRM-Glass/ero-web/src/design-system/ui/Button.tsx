import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { useReduzirMovimento } from '../../motion/reduzir';
import { cn } from '../../shared/util/utils';

/** `acao`: sem cor própria — a cor vem da classe de ação do kit (`acao-sucesso`, `acao-leve-info`... em index.css). */
type Variant = 'primary' | 'glass' | 'ghost' | 'danger' | 'acao';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const vc: Record<Variant, string> = {
  primary: 'accent-gradient accent-glow btn-shine font-semibold',
  glass: 'chip text-fg hover:bg-[var(--chip-hover)]',
  ghost: 'text-muted hover:text-fg hover:bg-[var(--chip)]',
  danger: 'bg-danger/12 text-danger border border-danger/25 hover:bg-danger/20',
  acao: '',
};
const sc: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-xl',
  md: 'h-10 px-4 text-sm gap-2 rounded-[14px]',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-2xl',
  icon: 'size-10 rounded-[14px] justify-center',
  'icon-sm': 'size-8 rounded-xl justify-center',
};
const iconeCarregando: Record<Size, string> = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-[18px]',
  icon: 'size-4',
  'icon-sm': 'size-4',
};

/** As duas camadas (rótulo e carregando) ocupam a mesma célula: a largura é a da maior, sem pular layout. */
const camada = 'col-start-1 row-start-1 inline-flex items-center justify-center [gap:inherit]';

export type ButtonProps = HTMLMotionProps<'button'> & {
  variant?: Variant;
  size?: Size;
  /**
   * Ação em andamento: mostra o indicador, fica `aria-disabled` + `aria-busy`, mantém a largura.
   * Não usa `disabled` de propósito: o botão continua focável (o foco não cai no <body> e quem usa
   * teclado ou leitor de tela não recomeça do topo). O clique é barrado aqui mesmo (`preventDefault`,
   * o que também impede o submit do formulário) e o `onClick` de quem usa não é chamado.
   * Passe sempre o booleano (também `false`) nos botões que podem carregar, para a estrutura não mudar.
   */
  carregando?: boolean;
  /**
   * Texto no lugar do rótulo enquanto carrega (ex.: "Entrando…"); é o que o leitor de tela anuncia.
   * Sem ele, o rótulo continua lá (transparente, acessível) e o indicador aparece por cima, centralizado.
   */
  textoCarregando?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'glass', size = 'md', className, children, type = 'button', carregando, textoCarregando, disabled, onClick, ...rest },
  ref,
) {
  const reduzir = useReduzirMovimento();
  const comCarregando = carregando !== undefined || textoCarregando !== undefined;
  const ocupado = !!carregando;
  // `disabled` comum vence: aí o botão sai do foco como sempre. Só carregando, fica focável e aria-disabled.
  const bloqueadoCarregando = ocupado && !disabled;
  const temTexto = textoCarregando !== undefined && textoCarregando !== null && textoCarregando !== false;

  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={ocupado ? undefined : { scale: 0.96 }}
      transition={spring.snappy}
      disabled={disabled}
      aria-disabled={bloqueadoCarregando || undefined}
      aria-busy={ocupado || undefined}
      data-carregando={ocupado || undefined}
      onClick={(e) => {
        if (ocupado) {
          // barra o clique e o submit do form (Enter num campo também chega aqui como clique no botão padrão)
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      className={cn(
        'inline-flex items-center font-medium whitespace-nowrap transition-colors select-none disabled:pointer-events-none',
        // Carregando não esmaece: o rótulo segue legível (AA) e o indicador herda a cor do texto.
        !ocupado && 'disabled:opacity-50',
        // Carregando não tem `disabled`, então o ponteiro chega no botão e mostra que está em andamento.
        bloqueadoCarregando && 'cursor-progress',
        vc[variant],
        sc[size],
        comCarregando && 'justify-center',
        className,
      )}
      {...rest}
    >
      {comCarregando ? (
        <span className="inline-grid [gap:inherit]">
          <span
            className={cn(
              camada,
              // Com texto próprio, o rótulo sai da árvore de acessibilidade; sem ele, fica transparente e continua sendo o nome do botão.
              ocupado && (temTexto ? 'invisible' : 'opacity-0'),
            )}
          >
            {children as ReactNode}
          </span>
          <span className={cn(camada, !ocupado && 'invisible')} aria-hidden={!ocupado || undefined}>
            <Loader2
              aria-hidden
              className={cn(iconeCarregando[size], 'shrink-0', ocupado && (reduzir ? 'carregando-pulso' : 'carregando-giro'))}
            />
            {temTexto && textoCarregando}
          </span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
});
