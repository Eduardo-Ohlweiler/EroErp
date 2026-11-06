package com.api.ero_api.sessao.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "Sessão aberta (um navegador logado)")
public record SessaoResponseDto(
        UUID id,
        String ip,
        String userAgent,
        @Schema(description = "Quando fez login") Instant iniciadaEm,
        Instant ultimoUsoEm,
        Instant expiraEm,
        @Schema(description = "É a sessão deste navegador") boolean atual) {
}
