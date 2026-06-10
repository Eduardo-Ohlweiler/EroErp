package com.api.ero_erp.clinica.dto;

public record RespostaAnamneseResponseDto(
        Long    campoId,
        String  secao,
        String  rotulo,
        String  tipo,
        String  opcoes,
        Integer ordem,
        Boolean obrigatorio,
        String  valor
) {}
