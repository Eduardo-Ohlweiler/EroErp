package com.api.ero_erp.financeiro.transferencia.dtos;

import java.math.BigDecimal;

public record TransferenciaEntreContasCreateDto(
        Long contaOrigemId,
        Long contaDestinoId,
        BigDecimal valor,
        String data,
        String descricao
) {}
