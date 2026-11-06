package com.api.ero_api.compartilhado.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/** Formato único de lista paginada que a API devolve. */
@Schema(description = "Página de resultados")
public record PaginaDto<T>(
        @Schema(description = "Itens desta página") List<T> conteudo,
        @Schema(description = "Número da página (começa em 0)", example = "0") int pagina,
        @Schema(description = "Itens por página", example = "20") int tamanho,
        @Schema(description = "Total de itens em todas as páginas", example = "137") long totalElementos,
        @Schema(description = "Total de páginas", example = "7") int totalPaginas) {

    public static <E, T> PaginaDto<T> de(Page<E> page, Function<E, T> conversor) {
        return new PaginaDto<>(
                page.getContent().stream().map(conversor).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }
}
