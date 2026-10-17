package com.api.ero_erp.produto.dtos;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * O produto com os nomes do que ele aponta, já resolvidos. Campo nulo sai do
 * JSON ({@code non_null}): a ausência de {@code custo} é o "não informado".
 */
public record ProdutoResponseDto(
        UUID id,
        Long codigo,
        String nome,
        String descricao,
        String ean,
        UUID unidadeMedidaId,
        String unidadeSigla,
        String unidadeDescricao,
        UUID grupoId,
        String grupoNome,
        UUID subgrupoId,
        String subgrupoNome,
        UUID categoriaId,
        String categoriaNome,
        UUID marcaId,
        String marcaNome,
        UUID fornecedorId,
        String fornecedorNome,
        BigDecimal custo,
        Boolean ativo,
        Instant createdAt,
        Instant updatedAt
) {}
