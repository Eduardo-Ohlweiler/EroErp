import { Bloco } from '../../motion/coreografia/Bloco';
import type { PaginaDto } from '../../shared/api/pagina';
import { Paginacao } from '../ui/Tabela';

/** "Exibindo 1–20 de 137 registros" (os números chegam formatados em pt-BR). */
export function textoExibindo(inicio: string, fim: string, total: string, totalNumero: number): string {
  return `Exibindo ${inicio}–${fim} de ${total} ${totalNumero === 1 ? 'registro' : 'registros'}`;
}

/**
 * Rodapé da grade (docs/07 §3.4): "Exibindo X–Y de N registros" e a paginação (`Paginacao`, página base 0),
 * lendo o `PaginaDto` da ero-api. Sem página ou sem registro, não aparece. É um bloco da montagem.
 */
export function TDataGridFooter<T>({
  pagina,
  onPaginaChange,
  carregando,
}: {
  pagina?: PaginaDto<T>;
  onPaginaChange: (pagina: number) => void;
  /** desliga anterior/próxima enquanto a página nova chega */
  carregando?: boolean;
}) {
  if (!pagina || pagina.totalElementos === 0) return null;
  return (
    <Bloco data-kit="TDataGridFooter" className="px-1">
      <Paginacao
        pagina={pagina.pagina}
        totalPaginas={pagina.totalPaginas}
        totalElementos={pagina.totalElementos}
        tamanho={pagina.tamanho}
        onPagina={onPaginaChange}
        carregando={carregando}
        textoFaixa={textoExibindo}
      />
    </Bloco>
  );
}
