package com.api.ero_erp.pedido.mapper;

import com.api.ero_erp.pedido.dtos.TipoPedidoResponseDto;
import com.api.ero_erp.pedido.dtos.TipoPedidoSummaryDto;
import com.api.ero_erp.pedido.entity.TipoPedido;

public class TipoPedidoMapper {

    private TipoPedidoMapper() {}

    public static TipoPedidoResponseDto toResponseDto(TipoPedido t) {
        return new TipoPedidoResponseDto(
                t.getId(),
                t.getNome(),
                t.getMovimentaEstoque(),
                t.getGeraFinanceiro(),
                t.isAtivo(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }

    public static TipoPedidoSummaryDto toSummaryDto(TipoPedido t) {
        return new TipoPedidoSummaryDto(
                t.getId(),
                t.getNome(),
                t.getMovimentaEstoque(),
                t.getGeraFinanceiro(),
                t.isAtivo()
        );
    }
}
