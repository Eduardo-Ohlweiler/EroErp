package com.api.ero_erp.crm.fluxokanban.dtos;

public record FluxoKanbanColunaResponseDto(
        Long    id,
        Long    andamentoId,
        String  andamentoNome,
        String  cor,
        Boolean sistema,
        Integer ordem
) {}
