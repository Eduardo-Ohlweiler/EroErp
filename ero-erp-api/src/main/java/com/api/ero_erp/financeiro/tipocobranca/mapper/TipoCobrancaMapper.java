package com.api.ero_erp.financeiro.tipocobranca.mapper;

import com.api.ero_erp.financeiro.tipocobranca.dtos.TipoCobrancaResponseDto;
import com.api.ero_erp.financeiro.tipocobranca.entity.TipoCobranca;

import java.util.List;

public class TipoCobrancaMapper {

    private TipoCobrancaMapper() {}

    public static TipoCobrancaResponseDto toDto(TipoCobranca tipo) {
        return new TipoCobrancaResponseDto(
                tipo.getId(),
                tipo.getNome(),
                tipo.getAtivo()
        );
    }

    public static List<TipoCobrancaResponseDto> toDtoList(List<TipoCobranca> tipos) {
        return tipos.stream().map(TipoCobrancaMapper::toDto).toList();
    }
}
