package com.api.ero_erp.estoque.dtos;

import java.math.BigDecimal;

public record EstoqueUpdateDto(
        BigDecimal precoVenda,
        BigDecimal quantidadeMinima,
        Boolean    bloqueado
) {}
