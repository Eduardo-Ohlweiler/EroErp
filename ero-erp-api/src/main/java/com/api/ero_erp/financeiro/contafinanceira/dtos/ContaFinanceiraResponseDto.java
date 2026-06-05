package com.api.ero_erp.financeiro.contafinanceira.dtos;

public record ContaFinanceiraResponseDto(
        Long    id,
        String  nome,
        Boolean ativo
) {}
