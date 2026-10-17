package com.api.ero_erp.estoque.dtos;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Item do combo das movimentações: só o que se movimenta — linha ativa, com
 * controle de estoque, de produto e filial ativos.
 */
public record EstoqueMovimentavelDto(
        UUID id,
        UUID produtoId,
        Long produtoCodigo,
        String produtoNome,
        String unidadeSigla,
        BigDecimal quantidade
) {}
