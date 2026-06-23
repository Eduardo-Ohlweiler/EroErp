package com.api.ero_erp.financeiro.contareceber.dtos;

import java.math.BigDecimal;

public record ParcelaContaReceberResponseDto(
        Long    id,
        Integer numeroParcela,
        String  dataVencimento,
        BigDecimal valor,
        Long   formaPagamentoId,
        String formaPagamentoNome,
        Long   contaFinanceiraId,
        String contaFinanceiraNome,
        String dataPagamento,
        BigDecimal valorPago,
        String status,
        String observacao,
        Boolean credito
) {}
