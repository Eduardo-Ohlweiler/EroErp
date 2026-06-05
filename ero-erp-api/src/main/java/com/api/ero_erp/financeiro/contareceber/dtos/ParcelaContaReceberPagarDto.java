package com.api.ero_erp.financeiro.contareceber.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ParcelaContaReceberPagarDto(
        @NotBlank(message = "Data de pagamento é obrigatória")
        String dataPagamento,

        @NotNull(message = "Valor pago é obrigatório")
        BigDecimal valorPago,

        @NotNull(message = "Conta financeira é obrigatória")
        Long contaFinanceiraId,

        @NotNull(message = "Forma de pagamento é obrigatória")
        Long formaPagamentoId
) {}
