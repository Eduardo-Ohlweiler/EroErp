package com.api.ero_erp.pedido.dtos;

import com.api.ero_erp.pedido.enums.GeraFinanceiro;
import com.api.ero_erp.pedido.enums.MovimentaEstoque;

import java.time.LocalDateTime;

public record TipoPedidoResponseDto(
        Long             id,
        String           nome,
        MovimentaEstoque movimentaEstoque,
        GeraFinanceiro   geraFinanceiro,
        boolean          ativo,
        LocalDateTime    createdAt,
        LocalDateTime    updatedAt
) {}
