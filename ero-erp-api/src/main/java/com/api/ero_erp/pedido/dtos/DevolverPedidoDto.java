package com.api.ero_erp.pedido.dtos;

import java.math.BigDecimal;
import java.util.List;

public record DevolverPedidoDto(
        String                 tipo,   // TOTAL | PARCIAL
        String                 motivo,
        List<ItemDevolucaoDto> itens   // usado quando tipo = PARCIAL
) {
    public record ItemDevolucaoDto(
            Long       pedidoProdutoId,
            BigDecimal quantidade
    ) {}
}
