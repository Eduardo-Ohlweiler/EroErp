package com.api.ero_erp.estoque.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransferenciaResponseDto(
        Long          id,
        Long          clienteId,

        Long          produtoId,
        String        produtoNome,

        Long          emitenteOrigemId,
        String        emitenteOrigemNome,

        Long          emitenteDestinoId,
        String        emitenteDestinoNome,

        BigDecimal    quantidade,
        String        observacao,

        String        createdByNome,
        LocalDateTime createdAt
) {}
