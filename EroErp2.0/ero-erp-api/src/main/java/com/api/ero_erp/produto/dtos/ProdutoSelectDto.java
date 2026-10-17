package com.api.ero_erp.produto.dtos;

import java.util.UUID;

/**
 * Item de combo. Sem custo, sem fornecedor: o combo é aberto a qualquer
 * autenticado — o antigo devolvia o produto inteiro aqui, custo incluído.
 */
public record ProdutoSelectDto(
        UUID id,
        Long codigo,
        String nome,
        String unidadeSigla
) {}
