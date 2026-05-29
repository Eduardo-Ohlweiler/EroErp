package com.api.ero_erp.whatsapp.whatsappconfigglobal.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public record WhatsappConfigGlobalResponseDto(
        @Schema(description = "ID da configuração", example = "1")
        Long id,

        @Schema(description = "URL base do servidor Evolution API", example = "https://evolution.meuservidor.com")
        String apiUrl,

        @Schema(description = "Chave global de acesso à Evolution API", example = "minha-api-key-secreta")
        String apiKey,

        @Schema(description = "Indica se a configuração está ativa", example = "true")
        Boolean ativo,

        @Schema(description = "Data de criação")
        LocalDateTime createdAt,

        @Schema(description = "Data de atualização")
        LocalDateTime updatedAt
) {}
