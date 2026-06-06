package com.api.ero_erp.financeiro.lancamento.dtos;

import java.math.BigDecimal;

public record LancamentoFinanceiroResponseDto(
        Long id,
        Long contaFinanceiraId,
        String contaFinanceiraNome,
        String tipo,
        BigDecimal valor,
        String descricao,
        String data,
        String createdAt
) {}
