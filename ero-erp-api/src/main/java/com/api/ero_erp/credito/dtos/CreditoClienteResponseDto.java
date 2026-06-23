package com.api.ero_erp.credito.dtos;

import java.math.BigDecimal;

public record CreditoClienteResponseDto(
        Long          id,
        Long          pessoaId,
        String        pessoaNome,
        String        tipo,
        BigDecimal    valor,
        String        origem,
        Long          pedidoId,
        Long          contaReceberId,
        String        data
) {}
