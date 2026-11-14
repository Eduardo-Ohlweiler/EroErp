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
        @Schema(description = "Quem executou a ação (vazio em login/sistema e quando foi o suporte)") UUID autorId,
        @Schema(description = "Nome de quem executou (vazio em login/sistema e quando foi o suporte)") String autorNome,
        @Schema(description = "Feito pelo suporte da plataforma, visto de dentro do contratante: "
                + "o superadmin não aparece (sem id, IP e navegador). O front mostra \"Suporte da plataforma\"")
        boolean suporte,
        @Schema(description = "IP de origem (vazio quando foi o suporte)") String ip,
        @Schema(description = "Navegador (vazio quando foi o suporte)") String userAgent,
        String detalhe,
        @Schema(description = "Quando aconteceu") Instant ocorridoEm) {
}
