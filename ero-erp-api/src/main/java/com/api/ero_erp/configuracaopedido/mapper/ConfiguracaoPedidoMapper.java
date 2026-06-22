package com.api.ero_erp.configuracaopedido.mapper;

import com.api.ero_erp.configuracaopedido.dtos.ConfiguracaoPedidoResponseDto;
import com.api.ero_erp.configuracaopedido.entity.ConfiguracaoPedido;

public class ConfiguracaoPedidoMapper {

    private ConfiguracaoPedidoMapper() {}

    public static ConfiguracaoPedidoResponseDto toDto(ConfiguracaoPedido entity) {
        return new ConfiguracaoPedidoResponseDto(
                entity.getId(),
                entity.getFaturarAoConcluir()
        );
    }
}
