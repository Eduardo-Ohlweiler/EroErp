import { cn } from '../../shared/util/utils';

/**
 * Esqueleto de carregamento (bloco cinza com brilho que atravessa; parado com movimento reduzido).
 * Decorativo: quem carrega anuncia o estado (ex.: `aria-busy` no contêiner).
 */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn('skeleton block h-4', className)} />;
}

/** Parágrafo de esqueleto: a última linha é mais curta. */
export function SkeletonTexto({ linhas = 3, className }: { linhas?: number; className?: string }) {
  return (
    <span aria-hidden className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: linhas }, (_, i) => (
        <Skeleton key={i} className={cn('h-3', i === linhas - 1 ? 'w-3/5' : 'w-full')} />
      ))}
    </span>
  );
}
