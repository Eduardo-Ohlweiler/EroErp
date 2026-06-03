package com.api.ero_erp.estoque.dtos;

import java.math.BigDecimal;

public record EstoqueAlertaDto(
        Long       estoqueId,
        Long       emitenteId,
        String     emitenteNome,
        Long       produtoId,
        String     produtoNome,
        String     produtoCodigo,
        String     unidadeMedidaSigla,
        BigDecimal quantidade,
        BigDecimal quantidadeMinima
) {}
