package com.api.ero_erp.crm.configuracaocrm.mapper;

import com.api.ero_erp.crm.configuracaocrm.dtos.ConfiguracaoCrmResponseDto;
import com.api.ero_erp.crm.configuracaocrm.entity.ConfiguracaoCrm;
import com.api.ero_erp.crm.lembretependencia.dtos.LembretePendenciaResponseDto;

import java.util.Comparator;
import java.util.List;

public class ConfiguracaoCrmMapper {

    private ConfiguracaoCrmMapper() {}

    public static ConfiguracaoCrmResponseDto toDto(ConfiguracaoCrm entity) {
        List<LembretePendenciaResponseDto> lembretes = entity.getLembretes() == null
                ? List.of()
                : entity.getLembretes().stream()
                        .sorted(Comparator.comparing(
                                l -> l.getOrdem() != null ? l.getOrdem() : Integer.MAX_VALUE))
                        .map(l -> new LembretePendenciaResponseDto(
                                l.getId(),
                                l.getTempoHoras(),
                                l.getMensagem(),
                                l.getOrdem()
                        ))
                        .toList();

        return new ConfiguracaoCrmResponseDto(
                entity.getId(),
                entity.getProvedor(),
                entity.getApiUrl(),
                entity.getInstanceName(),
                entity.getNumero(),
                entity.getAtivo(),
                entity.getApiKey() != null && !entity.getApiKey().isBlank(),
                entity.getToken()  != null && !entity.getToken().isBlank(),
                entity.getAtivarPendencias(),
                lembretes
        );
    }
}
