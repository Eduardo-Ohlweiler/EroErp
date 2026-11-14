import type { KeyboardEvent, ReactNode, SyntheticEvent } from 'react';
import { motion } from 'motion/react';
import { useVariantesDoPapel } from '../../motion/coreografia';
import { kit } from '../../motion/tokens';
import { ErroApi } from '../../shared/api/erros';
import { cn } from '../../shared/util/utils';
import { EstadoErro, EstadoVazio } from '../ui/Estados';
import { Skeleton } from '../ui/Skeleton';
import { Tabela, type ColunaTabela } from '../ui/Tabela';
import { TamanhoDoTButton } from './TButton';

export type Coluna<T> = {
  chave: string;
  cabecalho: string;
  render: (linha: T) => ReactNode;
  /** alinha à direita, números tabulares */
  numerica?: boolean;
  /** some antes das demais em tela média (abaixo de `lg`); nunca na principal */
  secundaria?: boolean;
  /** ex.: `'w-px whitespace-nowrap'` em código, data, valor e situação */
  className?: string;
  /**
   * A coluna principal (nome, descrição). Com `tituloCartao`, ela não se repete na lista do cartão do celular.
   * Sem nenhuma marcada, vale a primeira.
   */
  principal?: true;
};

export type TDataGridProps<T> = {
  colunas: Coluna<T>[];
  linhas: T[];
  chaveDe: (linha: T) => string;
  /** sem linhas: esqueleto; com linhas (trocando de página), as antigas ficam até chegarem as novas */
  carregando?: boolean;
  onLinhaClick?: (linha: T) => void;
  /** título de cada cartão no celular (abaixo de `md`); sem ele, o cartão lista todas as colunas */
  tituloCartao?: (linha: T) => ReactNode;
  vazioTitulo?: string;
  vazioDescricao?: string;
  /** botões da linha (`TButton variant="editar" label=""`...), na primeira coluna; no cartão, embaixo */
  acoes?: (linha: T) => ReactNode;
  /** erro da consulta (`lista.error`): mostra o `EstadoErro` no lugar das linhas */
  erro?: unknown;
  onTentarDeNovo?: () => void;
  /** nome da grade para leitor de tela (padrão "Resultados") */
  rotulo?: string;
  /** nome de cada linha para quem navega por teclado (padrão: "Abrir" + título do cartão, quando é texto) */
  rotuloLinha?: (linha: T) => string;
};

const parar = (e: SyntheticEvent) => e.stopPropagation();

/**
 * A grade do kit (docs/07 §3.4): a `Tabela` glass (`glass-solid`, cabeçalho fixo) a partir de `md` e **cartões**
 * abaixo dele. Ações na primeira coluna, como no EroErp antigo; clique e Enter nos botões não abrem a linha.
 */
export function TDataGrid<T>({
  colunas,
  linhas,
  chaveDe,
  carregando = false,
  onLinhaClick,
  tituloCartao,
  vazioTitulo = 'Nenhum registro encontrado',
  vazioDescricao = 'Ajuste os filtros ou cadastre o primeiro.',
  acoes,
  erro,
  onTentarDeNovo,
  rotulo = 'Resultados',
  rotuloLinha,
}: TDataGridProps<T>) {
  // Papéis `grade` e `linhaGrade` (motion/tokens.ts, kit): a grade encaixa como bloco e as primeiras linhas, em cascata.
  const grade = useVariantesDoPapel('grade');
  const linhaGrade = useVariantesDoPapel('linhaGrade');
  const esqueleto = carregando && linhas.length === 0;
  const erroApi = erro instanceof ErroApi ? erro : undefined;
  const estadoErro = erro ? (
    <EstadoErro
      descricao={erroApi && !erroApi.semConexao ? erroApi.detail : undefined}
      codigo={erroApi?.correlationId}
      onTentarDeNovo={onTentarDeNovo}
      tentando={carregando}
    />
  ) : undefined;
  const vazio = <EstadoVazio titulo={vazioTitulo} descricao={vazioDescricao} />;
  const nomeDaLinha = (l: T) => {
    if (rotuloLinha) return rotuloLinha(l);
    const t = tituloCartao?.(l);
    return typeof t === 'string' ? `Abrir ${t}` : undefined;
  };

  const colunasTabela: ColunaTabela<T>[] = [
    ...(acoes
      ? [
          {
            chave: '__acoes',
            titulo: <span className="sr-only">Ações</span>,
            className: 'w-px whitespace-nowrap !py-2',
            esqueleto: 'w-14',
            celula: (l: T) => (
              <div className="flex items-center gap-1" onClick={parar} onKeyDown={parar}>
                <TamanhoDoTButton.Provider value="sm">{acoes(l)}</TamanhoDoTButton.Provider>
              </div>
            ),
          },
        ]
      : []),
    ...colunas.map<ColunaTabela<T>>((c) => ({
      chave: c.chave,
      titulo: c.cabecalho,
      celula: c.render,
      alinhar: c.numerica ? 'direita' : undefined,
      className: cn(c.numerica && 'tabular-nums', c.secundaria && 'hidden lg:table-cell', c.className),
    })),
  ];

  // No cartão com título, a coluna principal (marcada, senão a primeira) já é o título: não se repete na lista.
  const chavePrincipal = (colunas.find((c) => c.principal) ?? colunas[0])?.chave;
  const colunasDoCartao = tituloCartao ? colunas.filter((c) => c.chave !== chavePrincipal) : colunas;

  const tecla = (e: KeyboardEvent<HTMLLIElement>, l: T) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onLinhaClick?.(l);
    }
  };

  return (
    <div data-kit="TDataGrid" className="min-w-0" aria-busy={carregando || undefined}>
      <Tabela
        className="hidden md:block"
        rotulo={rotulo}
        colunas={colunasTabela}
        linhas={linhas}
        chaveLinha={chaveDe}
        carregando={esqueleto}
        erro={estadoErro}
        vazio={vazio}
        onLinhaClick={onLinhaClick}
        rotuloLinha={rotuloLinha ?? (tituloCartao ? (l) => nomeDaLinha(l) ?? '' : undefined)}
        variants={grade}
        variantesLinha={linhaGrade}
        linhasAnimadas={kit.linhas.quantas}
      />

      {/* Celular: cartões numa superfície de vidro só (uma camada de backdrop-filter, não uma por cartão). */}
      <motion.div variants={grade} className="glass-solid overflow-hidden md:hidden">
        {estadoErro ??
          (esqueleto ? (
            <ul aria-label={rotulo} className="divide-y divide-[var(--line)]">
              {Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="p-4 flex flex-col gap-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </li>
              ))}
            </ul>
          ) : linhas.length === 0 ? (
            vazio
          ) : (
            <ul aria-label={rotulo} className="divide-y divide-[var(--line)]">
              {linhas.map((l, i) => {
                const clicavel = !!onLinhaClick;
                return (
                  <motion.li
                    variants={i < kit.linhas.quantas ? linhaGrade : undefined}
                    key={chaveDe(l)}
                    tabIndex={clicavel ? 0 : undefined}
                    aria-label={clicavel ? nomeDaLinha(l) : undefined}
                    onClick={clicavel ? () => onLinhaClick(l) : undefined}
                    onKeyDown={clicavel ? (e) => tecla(e, l) : undefined}
                    className={cn('p-4 transicao-cor focus-visible:outline-offset-[-2px]', clicavel && 'cursor-pointer hover:bg-[var(--table-row-hover)]')}
                  >
                    {tituloCartao && <div className="mb-2.5 text-[15px] font-semibold">{tituloCartao(l)}</div>}
                    <dl className="flex flex-col gap-1.5">
                      {colunasDoCartao.map((c) => (
                        <div key={c.chave} className="flex items-start justify-between gap-3">
                          <dt className="text-xs text-muted pt-0.5">{c.cabecalho}</dt>
                          <dd className={cn('text-right text-sm min-w-0 break-words', c.numerica && 'tabular-nums')}>{c.render(l)}</dd>
                        </div>
                      ))}
                    </dl>
                    {acoes && (
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3" onClick={parar} onKeyDown={parar}>
                        <TamanhoDoTButton.Provider value="sm">{acoes(l)}</TamanhoDoTButton.Provider>
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          ))}
      </motion.div>
    </div>
  );
}
