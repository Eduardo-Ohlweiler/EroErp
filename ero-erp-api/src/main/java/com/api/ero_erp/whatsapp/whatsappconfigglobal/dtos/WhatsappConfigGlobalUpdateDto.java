package com.api.ero_erp.whatsapp.whatsappconfigglobal.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record WhatsappConfigGlobalUpdateDto(
        @Schema(description = "URL base do servidor Evolution API", example = "https://evolution.meuservidor.com")
        @NotBlank
        String apiUrl,

        @Schema(description = "Chave global de acesso à Evolution API", example = "minha-api-key-secreta")
        @NotBlank
        String apiKey,

        @Schema(description = "Indica se a configuração está ativa", example = "true")
        Boolean ativo
) {}
