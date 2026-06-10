package com.api.ero_erp.clinica.dto;

public record TemplateAnamnesesSummaryDto(
        Long    id,
        String  nome,
        String  finalidade,
        String  descricao,
        Boolean ativo,
        int     totalCampos
) {}
