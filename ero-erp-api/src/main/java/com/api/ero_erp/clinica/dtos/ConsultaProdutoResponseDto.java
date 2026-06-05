package com.api.ero_erp.clinica.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ConsultaProdutoResponseDto(
        Long          id,
        Long          produtoId,
        String        produtoNome,
        Long          emitenteId,
        String        emitenteNome,
        BigDecimal    quantidade,
        BigDecimal    precoUnitario,
        String        tipoAjuste,
        String        tipoCalculo,
        BigDecimal    valorAjuste,
        BigDecimal    total,
        LocalDateTime createdAt
) {}
