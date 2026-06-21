package com.api.ero_erp.otorrino.dto;

import java.util.List;

public record QuestionarioDetalheDto(
        Long                       id,
        String                     codigo,
        String                     nome,
        String                     descricao,
        String                     instrucao,
        List<QuestionarioOpcaoDto> opcoes,
        List<QuestionarioItemDto>  itens
) {}
