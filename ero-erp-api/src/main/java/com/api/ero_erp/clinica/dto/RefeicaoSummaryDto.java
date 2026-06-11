package com.api.ero_erp.clinica.dto;

public record RefeicaoSummaryDto(
        Long    id,
        String  nome,
        String  descricao,
        boolean ativo
) {}
