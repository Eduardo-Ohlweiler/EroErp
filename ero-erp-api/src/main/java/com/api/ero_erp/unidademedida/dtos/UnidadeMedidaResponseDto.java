package com.api.ero_erp.unidademedida.dtos;

public record UnidadeMedidaResponseDto(
        Long   id,
        String sigla,
        String descricao,
        Boolean ativo
) {}
