package com.api.ero_erp.crm.lembretependencia.dtos;

public record LembretePendenciaResponseDto(
        Long    id,
        Integer tempoHoras,
        String  mensagem,
        Integer ordem
) {}
