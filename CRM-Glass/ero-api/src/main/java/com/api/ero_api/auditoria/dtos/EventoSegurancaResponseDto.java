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
        @Schema(description = "Nome do contratante (só na visão de plataforma)") String tenantNome,
        @Schema(description = "Usuário afetado pelo evento (ex.: quem foi inativado)") UUID usuarioId,
        @Schema(description = "Nome do usuário afetado (vazio se não for visível daqui)") String usuarioNome,
        @Schema(description = "Quem executou a ação (vazio em login/sistema)") UUID autorId,
        @Schema(description = "Nome de quem executou. Vazio com autorId preenchido = suporte da plataforma") String autorNome,
        String ip,
        String userAgent,
        String detalhe,
        @Schema(description = "Quando aconteceu") Instant ocorridoEm) {
}
