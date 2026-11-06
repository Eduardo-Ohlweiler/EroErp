package com.api.ero_api.auditoria.dtos;

import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "Evento da trilha de segurança")
public record EventoSegurancaResponseDto(
        UUID id,
        TipoEventoSeguranca tipo,
        UUID tenantId,
        @Schema(description = "Usuário afetado pelo evento (ex.: quem foi inativado)") UUID usuarioId,
        @Schema(description = "Quem executou a ação (vazio em login/sistema)") UUID autorId,
        String ip,
        String userAgent,
        String detalhe,
        @Schema(description = "Quando aconteceu") Instant ocorridoEm) {
}
