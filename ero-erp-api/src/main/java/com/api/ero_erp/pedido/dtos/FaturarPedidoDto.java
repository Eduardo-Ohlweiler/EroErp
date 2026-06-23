package com.api.ero_erp.pedido.dtos;

import java.math.BigDecimal;

public record FaturarPedidoDto(Long contaId, BigDecimal creditoUtilizado) {}
