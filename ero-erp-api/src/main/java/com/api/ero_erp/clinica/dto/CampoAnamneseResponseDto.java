package com.api.ero_erp.clinica.dto;

public record CampoAnamneseResponseDto(
        Long    id,
        String  secao,
        String  rotulo,
        String  tipo,
        String  opcoes,
        Integer ordem,
        Boolean obrigatorio,
        Boolean ativo
) {}
