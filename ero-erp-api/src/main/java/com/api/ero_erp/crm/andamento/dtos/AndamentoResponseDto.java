package com.api.ero_erp.crm.andamento.dtos;

public record AndamentoResponseDto(
        Long    id,
        String  nome,
        Boolean ativo,
        Boolean concluiAtendimento,
        Boolean cancelaAtendimento,
        Boolean sistema,
        String  chave,
        String  cor
) {}
