package com.api.ero_erp.configuracaopendencias.mapper;

import com.api.ero_erp.configuracaopendencias.dtos.ConfiguracaoPendenciasResponseDto;
import com.api.ero_erp.configuracaopendencias.entity.ConfiguracaoPendencias;

public class ConfiguracaoPendenciasMapper {

    private ConfiguracaoPendenciasMapper() {}

    public static ConfiguracaoPendenciasResponseDto toDto(ConfiguracaoPendencias entity) {
        return new ConfiguracaoPendenciasResponseDto(
                entity.getId(),
                entity.getDiasAntes(),
                entity.getNotificarClientesVencimento(),
                entity.getMensagemAviso()
        );
    }
}
