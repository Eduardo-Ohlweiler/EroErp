package com.api.ero_erp.configuracaodocumento.mapper;

import com.api.ero_erp.configuracaodocumento.dtos.ConfiguracaoDocumentoResponseDto;
import com.api.ero_erp.configuracaodocumento.entity.ConfiguracaoDocumento;

public class ConfiguracaoDocumentoMapper {

    private ConfiguracaoDocumentoMapper() {}

    public static ConfiguracaoDocumentoResponseDto toDto(ConfiguracaoDocumento entity) {
        return new ConfiguracaoDocumentoResponseDto(
                entity.getId(),
                entity.getAssinaturaDigital()
        );
    }
}
