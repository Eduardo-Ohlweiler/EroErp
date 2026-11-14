package com.api.ero_api.auditoria.mapper;

import com.api.ero_api.auditoria.dtos.EventoSegurancaResponseDto;
import com.api.ero_api.auditoria.entity.EventoSeguranca;
import java.util.Map;
import java.util.UUID;

public final class EventoSegurancaMapper {

    private EventoSegurancaMapper() {
    }

    /**
     * Os nomes vêm resolvidos de uma vez para a página inteira (sem N+1).
     * {@code suporte} (decidido pelo ConsultaEventoService): evento do superadmin visto
     * de dentro do contratante; o id dele, o IP e o navegador não saem.
     */
    public static EventoSegurancaResponseDto toResponseDto(EventoSeguranca e, Map<UUID, String> nomesUsuarios,
                                                           Map<UUID, String> nomesTenants, boolean suporte) {
        return new EventoSegurancaResponseDto(
                e.getId(),
                e.getTipo(),
                e.getTenantId(),
                nome(nomesTenants, e.getTenantId()),
                visivel(nomesUsuarios, e.getUsuarioId(), suporte),
                nome(nomesUsuarios, e.getUsuarioId()),
                visivel(nomesUsuarios, e.getCreatedBy(), suporte),
                nome(nomesUsuarios, e.getCreatedBy()),
                suporte,
                suporte ? null : e.getIp(),
                suporte ? null : e.getUserAgent(),
                e.getDetalhe(),
                e.getCreatedAt());
    }

    private static String nome(Map<UUID, String> nomes, UUID id) {
        return id == null ? null : nomes.get(id);
    }

    /** No evento do suporte, só sai o id de quem tem nome visível daqui (o superadmin não tem). */
    private static UUID visivel(Map<UUID, String> nomes, UUID id, boolean suporte) {
        return suporte && id != null && !nomes.containsKey(id) ? null : id;
    }
}
