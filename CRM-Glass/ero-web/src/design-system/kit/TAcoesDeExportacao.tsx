import { useCallback, useEffect, useRef, useState } from 'react';
import { TAMANHO_MAXIMO_PAGINA } from '../../shared/api/pagina';
import { baixarCsv, nomeDeArquivo, type ColunaExportavel } from './planilha';
import { TButton } from './TButton';
import { useMessage } from './useMessage';

/**
 * Teto de linhas de uma exportação (o do 2.0). Existe para o navegador não montar uma folha de 40 mil linhas, e é
 * **anunciado** quando corta: truncar calado faz a exportação parecer completa sem ser.
 */
export const TETO_DE_EXPORTACAO = 2000;

/** Linhas por requisição: o máximo que a ero-api devolve (`PaginacaoUtils.TAMANHO_MAXIMO`); pedir mais devolve 100, calado. */
export const LINHAS_POR_REQUISICAO = TAMANHO_MAXIMO_PAGINA;

/** Uma página da consulta, como a listagem devolve. */
export type PaginaDaCarga<T> = {
  linhas: T[];
  /** quantas linhas atendem ao filtro no total, não só nesta página */
  total: number;
};

export type ResultadoDaCarga<T> = {
  linhas: T[];
  /** quantas linhas atendem ao filtro além das que vieram */
  restantes: number;
};

/**
 * Junta páginas até cobrir o filtro, bater no teto ou vir página vazia (guarda contra laço se o total mentir).
 * Função pura sobre o `carregar` (testável).
 */
export async function carregarAteOTeto<T>(
  carregar: (limite: number, indice: number) => Promise<PaginaDaCarga<T>>,
  teto = TETO_DE_EXPORTACAO,
  porPagina = LINHAS_POR_REQUISICAO,
): Promise<ResultadoDaCarga<T>> {
  const linhas: T[] = [];
  let total = 0;
  for (let indice = 0; linhas.length < teto; indice++) {
    const pagina = await carregar(porPagina, indice);
    total = pagina.total;
    if (pagina.linhas.length === 0) break;
    linhas.push(...pagina.linhas);
    if (linhas.length >= total) break;
  }
  const cortadas = linhas.slice(0, teto);
  return { linhas: cortadas, restantes: Math.max(0, total - cortadas.length) };
}

/**
 * **Exportar** (planilha CSV) e **Pdf** (a folha impressa), no rodapé do filtro da List, depois do Novo
 * (docs/07 §3.4). Os dois repetem a consulta com os **filtros aplicados**, página a página, até o teto — nunca
 * a página visível. As colunas são as mesmas nos dois, então papel e planilha não discordam.
 *
 * O Pdf é em dois tempos: os dados chegam, a tela monta o `documento` da `TPage` (`aoCarregarParaImprimir`), o
 * React pinta e só então `window.print()`.
 */
export function TAcoesDeExportacao<T>({
  nome,
  colunas,
  carregar,
  aoCarregarParaImprimir,
}: {
  /** vira o nome do arquivo e o título do relatório */
  nome: string;
  colunas: ColunaExportavel<T>[];
  /** a consulta com os filtros aplicados: `(limite, indice) => api.listar({ ...aplicados, page: indice, size: limite })` */
  carregar: (limite: number, indice: number) => Promise<PaginaDaCarga<T>>;
  /** entrega as linhas à tela, que monta o `documento` da `TPage` (`DocumentoLista`) */
  aoCarregarParaImprimir: (resultado: ResultadoDaCarga<T> | undefined) => void;
}) {
  const msg = useMessage();
  const [ocupado, setOcupado] = useState<'planilha' | 'pdf' | null>(null);
  const vaiImprimir = useRef(false);

  const avisarCorte = useCallback(
    (linhas: number, restantes: number, o: string) => {
      const n = (x: number) => x.toLocaleString('pt-BR');
      if (restantes > 0) msg.aviso(`${o} traz ${n(linhas)} registros; outros ${n(restantes)} atendem ao filtro e ficaram de fora. Estreite o filtro.`);
    },
    [msg],
  );

  const planilha = async () => {
    setOcupado('planilha');
    try {
      const { linhas, restantes } = await carregarAteOTeto(carregar);
      if (linhas.length === 0) return msg.info('Nenhum registro para o filtro aplicado.');
      baixarCsv(nomeDeArquivo(nome), colunas, linhas);
      avisarCorte(linhas.length, restantes, 'A planilha');
    } catch (e) {
      msg.erroApi(e);
    } finally {
      setOcupado(null);
    }
  };

  const pdf = async () => {
    setOcupado('pdf');
    try {
      const resultado = await carregarAteOTeto(carregar);
      if (resultado.linhas.length === 0) return msg.info('Nenhum registro para o filtro aplicado.');
      aoCarregarParaImprimir(resultado);
      vaiImprimir.current = true;
      avisarCorte(resultado.linhas.length, resultado.restantes, 'O relatório');
    } catch (e) {
      msg.erroApi(e);
    } finally {
      setOcupado(null);
    }
  };

  // O documento só existe depois que o React pintou as linhas: um quadro para o commit, outro para o layout.
  useEffect(() => {
    if (!vaiImprimir.current) return;
    vaiImprimir.current = false;
    let segundo = 0;
    const primeiro = requestAnimationFrame(() => {
      segundo = requestAnimationFrame(() => window.print());
    });
    return () => {
      cancelAnimationFrame(primeiro);
      cancelAnimationFrame(segundo);
    };
  });

  return (
    <>
      <TButton variant="exportar" onClick={planilha} loading={ocupado === 'planilha'} disabled={ocupado === 'pdf'} />
      <TButton variant="pdf" onClick={pdf} loading={ocupado === 'pdf'} disabled={ocupado === 'planilha'} />
    </>
  );
}
