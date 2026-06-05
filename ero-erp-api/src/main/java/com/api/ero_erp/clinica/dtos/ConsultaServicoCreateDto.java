package com.api.ero_erp.clinica.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record ConsultaServicoCreateDto(

        @NotNull(message = "Produto é obrigatório")
        Long produtoId,

        @NotNull(message = "Quantidade é obrigatória")
        @Positive(message = "Quantidade deve ser positiva")
        BigDecimal quantidade,

        @NotNull(message = "Preço unitário é obrigatório")
        BigDecimal precoUnitario,

        String     tipoAjuste,
        String     tipoCalculo,
        BigDecimal valorAjuste
) {}
