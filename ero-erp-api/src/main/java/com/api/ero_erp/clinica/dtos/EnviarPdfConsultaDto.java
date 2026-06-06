package com.api.ero_erp.clinica.dtos;

public record EnviarPdfConsultaDto(
        String base64,
        String fileName,
        String caption
) {}
