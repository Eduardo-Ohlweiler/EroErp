package com.api.ero_erp.pedido.dtos;

import com.api.ero_erp.pedido.enums.GeraFinanceiro;
import com.api.ero_erp.pedido.enums.MovimentaEstoque;

public record TipoPedidoSummaryDto(
        Long             id,
        String           nome,
        MovimentaEstoque movimentaEstoque,
        GeraFinanceiro   geraFinanceiro,
        boolean          ativo
) {}
