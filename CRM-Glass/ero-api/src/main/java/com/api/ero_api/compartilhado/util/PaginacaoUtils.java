package com.api.ero_api.compartilhado.util;

import com.api.ero_api.compartilhado.exception.RegraNegocioException;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Valida a paginação que veio do cliente.
 *
 * <p>Ordenação só por campos da lista branca de cada módulo (evita ordenar por
 * campo sensível ou inexistente) e no máximo 100 itens por página.
 */
public final class PaginacaoUtils {

    public static final int TAMANHO_MAXIMO = 100;

    private PaginacaoUtils() {
    }

    public static Pageable validar(Pageable pageable, Set<String> camposOrdenaveis, Sort ordemPadrao) {
        for (Sort.Order ordem : pageable.getSort()) {
            if (!camposOrdenaveis.contains(ordem.getProperty())) {
                throw new RegraNegocioException("Não é possível ordenar por \"" + ordem.getProperty() + "\".");
            }
        }
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : ordemPadrao;
        int tamanho = Math.min(pageable.getPageSize(), TAMANHO_MAXIMO);
        return PageRequest.of(pageable.getPageNumber(), tamanho, sort);
    }
}
