package com.api.ero_erp.clinica.dto;

import java.util.List;

public record TemplateAnamneseResponseDto(
        Long                          id,
        String                        nome,
        String                        finalidade,
        String                        descricao,
        Boolean                       ativo,
        List<CampoAnamneseResponseDto> campos
) {}
