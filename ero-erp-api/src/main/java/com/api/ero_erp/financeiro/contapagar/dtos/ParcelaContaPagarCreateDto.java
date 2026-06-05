package com.api.ero_erp.financeiro.contapagar.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ParcelaContaPagarCreateDto(
        @NotBlank(message = "Data de vencimento é obrigatória")
        String dataVencimento,

        @NotNull(message = "Valor é obrigatório")
        BigDecimal valor,

        Long formaPagamentoId,

        Long contaFinanceiraId,

        String observacao
) {}
