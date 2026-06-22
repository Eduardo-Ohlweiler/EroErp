package com.api.ero_erp.configuracaoconsulta.mapper;

import com.api.ero_erp.configuracaoconsulta.dtos.ConfiguracaoConsultaResponseDto;
import com.api.ero_erp.configuracaoconsulta.entity.ConfiguracaoConsulta;

public class ConfiguracaoConsultaMapper {

    private ConfiguracaoConsultaMapper() {}

    public static ConfiguracaoConsultaResponseDto toDto(ConfiguracaoConsulta entity) {
        return new ConfiguracaoConsultaResponseDto(
                entity.getId(),
                entity.getFaturarAoConcluir()
        );
    }
}
