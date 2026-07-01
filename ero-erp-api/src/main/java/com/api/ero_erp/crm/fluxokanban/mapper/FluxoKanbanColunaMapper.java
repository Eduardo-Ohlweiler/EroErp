package com.api.ero_erp.crm.fluxokanban.mapper;

import com.api.ero_erp.crm.andamento.entity.Andamento;
import com.api.ero_erp.crm.fluxokanban.dtos.FluxoKanbanColunaResponseDto;
import com.api.ero_erp.crm.fluxokanban.entity.FluxoKanbanColuna;

public class FluxoKanbanColunaMapper {

    private FluxoKanbanColunaMapper() {}

    public static FluxoKanbanColunaResponseDto toDto(FluxoKanbanColuna entity) {
        Andamento andamento = entity.getAndamento();
        return new FluxoKanbanColunaResponseDto(
                entity.getId(),
                andamento != null ? andamento.getId()      : null,
                andamento != null ? andamento.getNome()    : null,
                andamento != null ? andamento.getCor()     : null,
                andamento != null ? andamento.getSistema() : null,
                entity.getOrdem()
        );
    }
}
