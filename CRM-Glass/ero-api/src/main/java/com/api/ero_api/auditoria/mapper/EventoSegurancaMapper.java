package com.api.ero_api.auditoria.mapper;

import com.api.ero_api.auditoria.dtos.EventoSegurancaResponseDto;
import com.api.ero_api.auditoria.entity.EventoSeguranca;
import java.util.Map;
import java.util.UUID;

public final class EventoSegurancaMapper {

    private EventoSegurancaMapper() {
    }

    /** Os nomes vêm resolvidos de uma vez para a página inteira (sem N+1). */
    public static EventoSegurancaResponseDto toResponseDto(EventoSeguranca e, Map<UUID, String> nomesUsuarios,
                                                           Map<UUID, String> nomesTenants) {
        return new EventoSegurancaResponseDto(
                e.getId(),
                e.getTipo(),
                e.getTenantId(),
                nome(nomesTenants, e.getTenantId()),
                e.getUsuarioId(),
                nome(nomesUsuarios, e.getUsuarioId()),
                e.getCreatedBy(),
                nome(nomesUsuarios, e.getCreatedBy()),
                e.getIp(),
                e.getUserAgent(),
                e.getDetalhe(),
                e.getCreatedAt());
    }

    private static String nome(Map<UUID, String> nomes, UUID id) {
        return id == null ? null : nomes.get(id);
    }
}
