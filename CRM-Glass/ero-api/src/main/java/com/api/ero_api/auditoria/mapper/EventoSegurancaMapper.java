package com.api.ero_api.auditoria.mapper;

import com.api.ero_api.auditoria.dtos.EventoSegurancaResponseDto;
import com.api.ero_api.auditoria.entity.EventoSeguranca;

public final class EventoSegurancaMapper {

    private EventoSegurancaMapper() {
    }

    public static EventoSegurancaResponseDto toResponseDto(EventoSeguranca e) {
        return new EventoSegurancaResponseDto(
                e.getId(),
                e.getTipo(),
                e.getTenantId(),
                e.getUsuarioId(),
                e.getCreatedBy(),
                e.getIp(),
                e.getUserAgent(),
                e.getDetalhe(),
                e.getCreatedAt());
    }
}
