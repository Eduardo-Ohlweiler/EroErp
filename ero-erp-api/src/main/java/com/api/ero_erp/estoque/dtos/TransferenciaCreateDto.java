package com.api.ero_erp.estoque.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record TransferenciaCreateDto(

        @NotNull(message = "Produto é obrigatório")
        Long produtoId,

        @NotNull(message = "Emitente de origem é obrigatório")
        Long emitenteOrigemId,

        @NotNull(message = "Emitente de destino é obrigatório")
        Long emitenteDestinoId,

        @NotNull(message = "Quantidade é obrigatória")
        @DecimalMin(value = "0.0001", inclusive = true, message = "Quantidade deve ser maior que zero")
        BigDecimal quantidade,

        String observacao
) {}
