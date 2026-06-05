package com.api.ero_erp.estoque.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EstoqueResponseDto(
        Long          id,
        Long          clienteId,

        Long          emitenteId,
        String        emitenteNome,

        Long          produtoId,
        String        produtoNome,
        String        produtoCodigo,
        String        unidadeMedidaSigla,

        BigDecimal    quantidade,
        BigDecimal    quantidadeMinima,
        BigDecimal    precoVenda,
        BigDecimal    custoMedio,
        Boolean       bloqueado,
        Boolean       baixarEstoque,

        String        createdByNome,
        String        updatedByNome,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
