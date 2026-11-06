import type { ComponentType, ReactNode } from 'react';
import { CloudOff, Inbox, RotateCcw } from 'lucide-react';
import { cn } from '../../shared/util/utils';
import { Button } from './Button';

type Icone = ComponentType<{ className?: string; strokeWidth?: number }>;

function Moldura({ icone: I, tom, children, className, role }: { icone: Icone; tom: 'neutro' | 'perigo'; children: ReactNode; className?: string; role?: string }) {
  return (
    <div role={role} className={cn('flex flex-col items-center text-center py-12 px-6', className)}>
      <span
        aria-hidden
        className={cn('size-14 rounded-2xl grid place-items-center mb-4', tom === 'perigo' ? 'bg-danger/12 text-danger' : 'chip text-muted')}
      >
        <I className="size-6" strokeWidth={1.8} />
      </span>
      {children}
    </div>
  );
}

export type EstadoVazioProps = {
  titulo: ReactNode;
  descricao?: ReactNode;
  icone?: Icone;
  /** botão de ação (ex.: "Novo usuário", "Limpar filtros") */
  acao?: ReactNode;
  className?: string;
};

/** Lista sem itens ou busca sem resultado. */
export function EstadoVazio({ titulo, descricao, icone = Inbox, acao, className }: EstadoVazioProps) {
  return (
    <Moldura icone={icone} tom="neutro" className={className}>
      <div className="text-[15px] font-semibold">{titulo}</div>
      {descricao && <p className="text-sm text-muted mt-1 max-w-sm">{descricao}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </Moldura>
  );
}

export type EstadoErroProps = {
  titulo?: ReactNode;
  descricao?: ReactNode;
  /** mostra "Tentar de novo" */
  onTentarDeNovo?: () => void;
  /** true enquanto tenta de novo (desabilita o botão) */
  tentando?: boolean;
  /** correlationId do ProblemDetail, mostrado como "Código para o suporte" */
  codigo?: string;
  icone?: Icone;
  className?: string;
};

/** Falha ao carregar dados. Anunciado na hora (role=alert). */
export function EstadoErro({
  titulo = 'Não foi possível carregar',
  descricao = 'Verifique sua conexão e tente de novo.',
  onTentarDeNovo,
  tentando,
  codigo,
  icone = CloudOff,
  className,
}: EstadoErroProps) {
  return (
    <Moldura icone={icone} tom="perigo" className={className} role="alert">
      <div className="text-[15px] font-semibold">{titulo}</div>
      {descricao && <p className="text-sm text-muted mt-1 max-w-sm">{descricao}</p>}
      {codigo && (
        <p className="text-xs text-subtle mt-2">
          Código para o suporte: <span className="font-mono text-muted select-all">{codigo}</span>
        </p>
      )}
      {onTentarDeNovo && (
        <Button className="mt-5" onClick={onTentarDeNovo} disabled={tentando}>
          <RotateCcw className={cn('size-4', tentando && 'motion-safe:animate-spin')} />
          Tentar de novo
        </Button>
      )}
    </Moldura>
  );
}
