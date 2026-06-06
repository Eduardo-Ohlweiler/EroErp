package com.api.ero_erp.financeiro.pagarcontas.dtos;

public record EnviarPdfFinanceiroDto(
        Long   pessoaId,
        String base64,
        String fileName,
        String caption
) {}
