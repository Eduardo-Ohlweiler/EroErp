package com.api.ero_erp.financeiro.lancamento.dtos;

import java.math.BigDecimal;

public record LancamentoFinanceiroCreateDto(
        Long contaFinanceiraId,
        String tipo,
        BigDecimal valor,
        String descricao,
        String data
) {}
