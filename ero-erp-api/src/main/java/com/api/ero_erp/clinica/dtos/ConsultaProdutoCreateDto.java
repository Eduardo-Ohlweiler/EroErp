package com.api.ero_erp.clinica.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record ConsultaProdutoCreateDto(

        @NotNull(message = "Produto é obrigatório")
        Long produtoId,

        @NotNull(message = "Emitente é obrigatório")
        Long emitenteId,

        @NotNull(message = "Quantidade é obrigatória")
        @Positive(message = "Quantidade deve ser positiva")
        BigDecimal quantidade,

        String     tipoAjuste,
        String     tipoCalculo,
        BigDecimal valorAjuste
) {}
