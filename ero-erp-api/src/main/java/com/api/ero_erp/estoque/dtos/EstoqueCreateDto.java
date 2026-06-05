package com.api.ero_erp.estoque.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record EstoqueCreateDto(

        @NotNull(message = "Emitente é obrigatório")
        Long emitenteId,

        @NotNull(message = "Produto é obrigatório")
        Long produtoId,

        @NotNull(message = "Quantidade inicial é obrigatória")
        @DecimalMin(value = "0", message = "Quantidade não pode ser negativa")
        BigDecimal quantidadeInicial,

        BigDecimal precoVenda,

        @DecimalMin(value = "0", message = "Quantidade mínima não pode ser negativa")
        BigDecimal quantidadeMinima,

        Boolean baixarEstoque,

        String motivo
) {}
