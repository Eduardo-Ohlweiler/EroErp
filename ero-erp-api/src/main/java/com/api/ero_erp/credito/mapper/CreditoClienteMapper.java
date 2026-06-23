package com.api.ero_erp.credito.mapper;

import com.api.ero_erp.credito.dtos.CreditoClienteResponseDto;
import com.api.ero_erp.credito.entity.CreditoCliente;

public class CreditoClienteMapper {

    private CreditoClienteMapper() {}

    public static CreditoClienteResponseDto toDto(CreditoCliente c) {
        return new CreditoClienteResponseDto(
                c.getId(),
                c.getPessoa().getId(),
                c.getPessoa().getNome(),
                c.getTipo() != null ? c.getTipo().name() : null,
                c.getValor(),
                c.getOrigem(),
                c.getPedidoId(),
                c.getContaReceberId(),
                c.getData() != null ? c.getData().toString() : null
        );
    }
}
