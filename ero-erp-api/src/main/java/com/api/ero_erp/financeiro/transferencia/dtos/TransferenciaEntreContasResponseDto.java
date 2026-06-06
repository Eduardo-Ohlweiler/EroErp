package com.api.ero_erp.financeiro.transferencia.dtos;

import java.math.BigDecimal;

public record TransferenciaEntreContasResponseDto(
        Long id,
        Long contaOrigemId,
        String contaOrigemNome,
        Long contaDestinoId,
        String contaDestinoNome,
        BigDecimal valor,
        String data,
        String descricao,
        String createdAt
) {}
