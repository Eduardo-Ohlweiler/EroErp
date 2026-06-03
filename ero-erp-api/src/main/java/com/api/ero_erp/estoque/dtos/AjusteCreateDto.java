package com.api.ero_erp.estoque.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AjusteCreateDto(

        @NotNull(message = "Estoque é obrigatório")
        Long estoqueId,

        @NotNull(message = "Quantidade nova é obrigatória")
        @DecimalMin(value = "0", message = "Quantidade não pode ser negativa")
        BigDecimal quantidadeNova,

        String motivo
) {}
