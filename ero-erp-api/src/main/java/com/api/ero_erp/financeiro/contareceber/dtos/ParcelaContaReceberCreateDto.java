package com.api.ero_erp.financeiro.contareceber.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ParcelaContaReceberCreateDto(
        @NotBlank(message = "Data de vencimento é obrigatória")
        String dataVencimento,

        @NotNull(message = "Valor é obrigatório")
        BigDecimal valor,

        Long formaPagamentoId,

        Long contaFinanceiraId,

        String observacao,

        String     dataPagamento,
        BigDecimal valorPago,

        // Parcela paga com crédito do cliente (não entra no caixa)
        Boolean    credito
) {}
