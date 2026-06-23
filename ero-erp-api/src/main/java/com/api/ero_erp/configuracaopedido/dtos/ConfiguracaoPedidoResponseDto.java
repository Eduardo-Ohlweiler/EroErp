package com.api.ero_erp.configuracaopedido.dtos;

public record ConfiguracaoPedidoResponseDto(
        Long   id,
        String faturarAoConcluir,
        String devolucaoGerarCredito
) {}
