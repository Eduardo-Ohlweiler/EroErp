import type { KeyboardEvent, ReactNode } from 'react';
import { motion, type Variants } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../shared/util/utils';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { variantesDoBloco, type PropsBloco } from './bloco';

export type ColunaTabela<T> = {
  chave: string;
  titulo: ReactNode;
  celula: (linha: T) => ReactNode;
  /** largura CSS (ex.: '160px', '20%') */
  largura?: string;
  alinhar?: 'esquerda' | 'direita' | 'centro';
  /** esconde em telas pequenas */
  esconderNoCelular?: boolean;
  /** forma do esqueleto da coluna enquanto carrega */
  esqueleto?: string;
  className?: string;
};

export type TabelaProps<T> = PropsBloco & {
  /** nome da tabela para leitores de tela (vira <caption> escondido) */
  rotulo: string;
  colunas: ColunaTabela<T>[];
  linhas: T[];
  chaveLinha: (linha: T) => string;
  carregando?: boolean;
  /** quantas linhas de esqueleto mostrar */
  linhasEsqueleto?: number;
  /** conteúdo quando não há linhas (EstadoVazio) */
  vazio?: ReactNode;
  /** conteúdo no lugar das linhas em caso de erro (EstadoErro) */
  erro?: ReactNode;
  /** linha clicável (abre a ficha); também abre com Enter */
  onLinhaClick?: (linha: T) => void;
  /** rótulo da linha para quem navega por teclado (ex.: l => `Abrir ${l.nome}`) */
  rotuloLinha?: (linha: T) => string;
  /** altura máxima da área rolável (o cabeçalho fica fixo) */
  alturaMax?: string;
  /** rodapé (Paginacao) */
  rodape?: ReactNode;
  /** variantes das primeiras linhas na montagem da tela (coreografia); sem elas, linhas não animam */
  variantesLinha?: Variants;
  /** quantas linhas entram em cascata; as demais aparecem juntas */
  linhasAnimadas?: number;
  className?: string;
};

const alinhamento = { esquerda: 'text-left', direita: 'text-right', centro: 'text-center' } as const;

/**
 * Tabela de dados em vidro sólido (leitura em primeiro lugar).
 * Cabeçalho fixo ao rolar, esqueleto ao carregar, estado vazio e de erro, rodapé com paginação.
 * O contêiner é um bloco da montagem da tela.
 */
export function Tabela<T>({
  rotulo,
  colunas,
  linhas,
  chaveLinha,
  carregando,
  linhasEsqueleto = 6,
  vazio,
  erro,
  onLinhaClick,
  rotuloLinha,
  alturaMax,
  rodape,
  variantesLinha,
  linhasAnimadas = 8,
  className,
  bloco = true,
  variants,
}: TabelaProps<T>) {
  const celulaCls = (c: ColunaTabela<T>) =>
    cn('px-4 py-3', alinhamento[c.alinhar ?? 'esquerda'], c.esconderNoCelular && 'hidden md:table-cell', c.className);

  const tecla = (e: KeyboardEvent<HTMLTableRowElement>, l: T) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onLinhaClick?.(l);
    }
  };

  let corpo: ReactNode;
  if (erro) {
    corpo = (
      <tr>
        <td colSpan={colunas.length}>{erro}</td>
      </tr>
    );
  } else if (carregando) {
    corpo = Array.from({ length: linhasEsqueleto }, (_, i) => (
      <tr key={`esq-${i}`}>
        {colunas.map((c) => (
          <td key={c.chave} className={celulaCls(c)}>
            <Skeleton className={cn('h-3.5', c.esqueleto ?? 'w-3/4', c.alinhar === 'direita' && 'ml-auto')} />
          </td>
        ))}
      </tr>
    ));
  } else if (linhas.length === 0) {
    corpo = (
      <tr>
        <td colSpan={colunas.length}>{vazio ?? <div className="py-10 text-center text-sm text-muted">Nada por aqui.</div>}</td>
      </tr>
    );
  } else {
    corpo = linhas.map((l, i) => {
      const clicavel = !!onLinhaClick;
      return (
        <motion.tr
          key={chaveLinha(l)}
          variants={variantesLinha && i < linhasAnimadas ? variantesLinha : undefined}
          data-clicavel={clicavel || undefined}
          tabIndex={clicavel ? 0 : undefined}
          aria-label={clicavel && rotuloLinha ? rotuloLinha(l) : undefined}
          onClick={clicavel ? () => onLinhaClick(l) : undefined}
          onKeyDown={clicavel ? (e) => tecla(e, l) : undefined}
          className="transition-colors focus-visible:outline-offset-[-2px]"
        >
          {colunas.map((c) => (
            <td key={c.chave} className={celulaCls(c)}>
              {c.celula(l)}
            </td>
          ))}
        </motion.tr>
      );
    });
  }

  return (
    <motion.div variants={variantesDoBloco(bloco, variants)} className={cn('glass-solid overflow-hidden', className)}>
      <div className="overflow-auto" style={alturaMax ? { maxHeight: alturaMax } : undefined}>
        <table className="tabela w-full text-sm border-collapse" aria-busy={carregando || undefined}>
          <caption className="sr-only">{rotulo}</caption>
          <thead>
            <tr>
              {colunas.map((c) => (
                <th
                  key={c.chave}
                  scope="col"
                  style={c.largura ? { width: c.largura } : undefined}
                  className={cn(
                    celulaCls(c),
                    'py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle whitespace-nowrap',
                  )}
                >
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{corpo}</tbody>
        </table>
      </div>
      {rodape && <div className="border-t border-line px-4 py-3">{rodape}</div>}
    </motion.div>
  );
}

export type PaginacaoProps = {
  /** página atual, começando em 0 (como o Spring devolve) */
  pagina: number;
  totalPaginas: number;
  totalElementos?: number;
  /** itens por página (para mostrar "1–50 de 1.234") */
  tamanho?: number;
  onPagina: (pagina: number) => void;
  carregando?: boolean;
  className?: string;
};

const int = new Intl.NumberFormat('pt-BR');

/** Paginação simples: "1–50 de 1.234", página X de Y, anterior/próxima. */
export function Paginacao({ pagina, totalPaginas, totalElementos, tamanho, onPagina, carregando, className }: PaginacaoProps) {
  const total = Math.max(1, totalPaginas);
  const temAnterior = pagina > 0;
  const temProxima = pagina < total - 1;
  const faixa =
    totalElementos !== undefined && tamanho
      ? totalElementos === 0
        ? 'Nenhum registro'
        : `${int.format(pagina * tamanho + 1)}–${int.format(Math.min(totalElementos, (pagina + 1) * tamanho))} de ${int.format(totalElementos)}`
      : null;
  return (
    <nav aria-label="Paginação" className={cn('flex flex-wrap items-center justify-between gap-3 text-xs text-muted', className)}>
      <span aria-live="polite">{faixa ?? `Página ${int.format(pagina + 1)} de ${int.format(total)}`}</span>
      <div className="flex items-center gap-1.5">
        {faixa && (
          <span className="mr-1.5 tabular-nums">
            Página {int.format(pagina + 1)} de {int.format(total)}
          </span>
        )}
        <Button size="sm" onClick={() => onPagina(pagina - 1)} disabled={!temAnterior || carregando} aria-label="Página anterior">
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
        <Button size="sm" onClick={() => onPagina(pagina + 1)} disabled={!temProxima || carregando} aria-label="Próxima página">
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
