package com.api.ero_erp.crm.andamento.mapper;

import com.api.ero_erp.crm.andamento.dtos.AndamentoResponseDto;
import com.api.ero_erp.crm.andamento.entity.Andamento;

public class AndamentoMapper {

    private AndamentoMapper() {}

    public static AndamentoResponseDto toDto(Andamento entity) {
        return new AndamentoResponseDto(
                entity.getId(),
                entity.getNome(),
                entity.getAtivo(),
                entity.getConcluiAtendimento(),
                entity.getCancelaAtendimento(),
                entity.getSistema(),
                entity.getChave(),
                entity.getCor()
        );
    }
}
