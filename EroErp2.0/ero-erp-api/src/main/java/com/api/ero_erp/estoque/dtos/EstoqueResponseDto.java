package com.api.ero_erp.estoque.dtos;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * @param produtoAtivo e {@code filialAtiva}: podem ter sido inativados
 *                     depois; a linha fica e a tela sinaliza
 * @param precoVenda   {@code null} quando não informado
 */
public record EstoqueResponseDto(
        UUID id,
        UUID produtoId,
        Long produtoCodigo,
        String produtoNome,
        Boolean produtoAtivo,
        String unidadeSigla,
        UUID filialId,
        String filialNome,
        String filialCor,
        Boolean filialAtiva,
        BigDecimal quantidade,
        BigDecimal precoVenda,
        Boolean controlaEstoque,
        BigDecimal quantidadeMinima,
        Boolean ativo,
        Instant createdAt,
        Instant updatedAt
) {}
