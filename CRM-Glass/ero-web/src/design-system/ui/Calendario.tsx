import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { hojeIso } from '../../shared/util/format';
import {
  dataPorExtenso,
  dentroDosLimites,
  diaDaSemana,
  DIAS_DA_SEMANA,
  nomeDoMes,
  partesIso,
  semanasDoMes,
  somarDias,
  somarMeses,
} from '../../shared/util/datas';
import { cn } from '../../shared/util/utils';

export type CalendarioProps = {
  /** data escolhida, `AAAA-MM-DD` (`null`/vazio = nenhuma) */
  valor?: string | null;
  onEscolher: (iso: string) => void;
  /** botão "Limpar" no rodapé; sem ele, o rodapé só tem "Hoje" */
  onLimpar?: () => void;
  /** primeiro e último dia que se pode escolher (`AAAA-MM-DD`) */
  min?: string;
  max?: string;
  /** põe o foco no dia (escolhido, senão hoje) ao montar — o popover do TDate liga */
  autoFoco?: boolean;
  className?: string;
};

/**
 * Calendário de um mês, em pt-BR (semana começando no domingo), no padrão "date picker" da WAI-ARIA:
 * grade com um dia focável por vez (setas andam um dia ou uma semana, Home/End vão ao começo e ao fim da semana,
 * PageUp/PageDown trocam de mês e, com Shift, de ano; Enter ou Espaço escolhe). O título do mês é anunciado ao
 * mudar. Não tem vidro próprio: vai dentro de um popover `glass-solid` (TDate).
 */
export function Calendario({ valor, onEscolher, onLimpar, min, max, autoFoco, className }: CalendarioProps) {
  const base = useId();
  const tituloId = `${base}-titulo`;
  const hoje = hojeIso();
  const inicial = partesIso(valor) ? valor! : dentroDosLimites(hoje, min, max) ? hoje : (min ?? max ?? hoje);
  const [foco, setFoco] = useState(inicial);
  const grade = useRef<HTMLTableElement>(null);
  /** só move o foco do navegador quando ele já está na grade (ou no autoFoco), nunca ao trocar de mês pelas setas do cabeçalho */
  const moverFoco = useRef(!!autoFoco);

  const p = partesIso(foco)!;
  const semanas = semanasDoMes(p.ano, p.mes);

  useEffect(() => {
    if (!moverFoco.current) return;
    moverFoco.current = false;
    grade.current?.querySelector<HTMLButtonElement>(`[data-dia="${foco}"]`)?.focus();
  }, [foco]);

  const irPara = (iso: string, focar = true) => {
    moverFoco.current = focar;
    setFoco(iso);
  };

  const tecla = (e: KeyboardEvent<HTMLTableElement>) => {
    const passos: Record<string, () => string> = {
      ArrowLeft: () => somarDias(foco, -1),
      ArrowRight: () => somarDias(foco, 1),
      ArrowUp: () => somarDias(foco, -7),
      ArrowDown: () => somarDias(foco, 7),
      Home: () => somarDias(foco, -diaDaSemana(foco)),
      End: () => somarDias(foco, 6 - diaDaSemana(foco)),
      PageUp: () => somarMeses(foco, e.shiftKey ? -12 : -1),
      PageDown: () => somarMeses(foco, e.shiftKey ? 12 : 1),
    };
    const passo = passos[e.key];
    if (!passo) return;
    e.preventDefault();
    irPara(passo());
  };

  const escolher = (iso: string) => {
    if (dentroDosLimites(iso, min, max)) onEscolher(iso);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          aria-label="Mês anterior"
          onClick={() => irPara(somarMeses(foco, -1), false)}
          className="size-8 rounded-[10px] grid place-items-center text-muted hover:text-fg hover:bg-[var(--chip-hover)] transicao-cor"
        >
          <ChevronLeft aria-hidden className="size-4" />
        </button>
        <span id={tituloId} aria-live="polite" className="text-sm font-semibold first-letter:uppercase">
          {nomeDoMes(p.ano, p.mes)}
        </span>
        <button
          type="button"
          aria-label="Próximo mês"
          onClick={() => irPara(somarMeses(foco, 1), false)}
          className="size-8 rounded-[10px] grid place-items-center text-muted hover:text-fg hover:bg-[var(--chip-hover)] transicao-cor"
        >
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>

      <table ref={grade} role="grid" aria-labelledby={tituloId} onKeyDown={tecla} className="border-separate border-spacing-0.5">
        <thead>
          <tr>
            {DIAS_DA_SEMANA.map((d) => (
              <th key={d.nome} scope="col" abbr={d.nome} className="size-9 text-[11px] font-medium text-subtle">
                <span aria-hidden>{d.curto}</span>
                <span className="sr-only">{d.nome}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanas.map((semana) => (
            <tr key={semana[0]}>
              {semana.map((iso) => {
                const dia = partesIso(iso)!;
                const doMes = dia.mes === p.mes;
                const escolhido = iso === valor;
                const ehHoje = iso === hoje;
                const permitido = dentroDosLimites(iso, min, max);
                return (
                  <td key={iso} role="gridcell" aria-selected={escolhido} className="p-0">
                    <button
                      type="button"
                      data-dia={iso}
                      tabIndex={iso === foco ? 0 : -1}
                      aria-label={dataPorExtenso(iso)}
                      aria-current={ehHoje ? 'date' : undefined}
                      // Fora de min/max: `aria-disabled`, não `disabled` (WAI-ARIA date picker). O dia continua
                      // focável, as setas e o PageUp chegam nele e o leitor de tela diz "indisponível"; o `escolher`
                      // recusa o Enter, o Espaço e o clique.
                      aria-disabled={permitido ? undefined : true}
                      onClick={() => {
                        irPara(iso, false);
                        escolher(iso);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          escolher(iso);
                        }
                      }}
                      className={cn(
                        'size-9 rounded-[10px] text-[13px] tabular-nums grid place-items-center transicao-cor',
                        // Sem `opacity` no dia indisponível: ele recebe foco, e o anel de foco esmaecido junto cairia
                        // abaixo de 3:1. Cor apagada + risco bastam.
                        'focus-visible:outline-offset-0 aria-disabled:text-subtle aria-disabled:font-normal aria-disabled:cursor-not-allowed aria-disabled:line-through',
                        escolhido
                          ? 'accent-gradient font-semibold'
                          : cn(
                              permitido && 'hover:bg-[var(--chip-hover)]',
                              doMes ? 'text-fg' : 'text-subtle',
                              ehHoje && 'border border-[var(--accent-text)] font-semibold',
                            ),
                      )}
                    >
                      {dia.dia}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between gap-2 border-t border-line pt-2 px-1">
        <button
          type="button"
          disabled={!dentroDosLimites(hoje, min, max)}
          onClick={() => escolher(hoje)}
          className="h-8 px-3 rounded-[10px] text-xs font-medium text-accent-text hover:bg-[var(--chip-hover)] transicao-cor disabled:opacity-50"
        >
          Hoje
        </button>
        {onLimpar && (
          <button
            type="button"
            onClick={onLimpar}
            className="h-8 px-3 rounded-[10px] text-xs font-medium text-muted hover:text-fg hover:bg-[var(--chip-hover)] transicao-cor"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
