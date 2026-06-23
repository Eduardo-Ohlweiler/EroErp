package com.api.ero_erp.credito.dtos;

import java.math.BigDecimal;

public record CreditoSaldoDto(
        Long       pessoaId,
        BigDecimal saldo
) {}
