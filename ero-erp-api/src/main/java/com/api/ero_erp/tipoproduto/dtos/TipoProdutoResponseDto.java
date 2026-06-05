package com.api.ero_erp.tipoproduto.dtos;

public record TipoProdutoResponseDto(
        Long    id,
        String  nome,
        Boolean ativo,
        String  classificacao
) {}
