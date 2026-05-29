package com.api.ero_erp.whatsapp.whatsappinstancia.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

public record WhatsappInstanciaUpdateDto(
        @Schema(description = "Nome amigável da instância", example = "Comercial")
        String nome,

        @Schema(description = "Token de autenticação da instância na Evolution API", example = "abc123token")
        String token,

        @Schema(description = "Fuso horário para envio dos lembretes", example = "America/Sao_Paulo")
        String timezone,

        @Schema(description = "Antecedência em minutos para envio de lembretes", example = "60")
        Integer antecedenciaMinutos,

        @Schema(description = "Indica se a instância está ativa", example = "true")
        Boolean ativo
) {}
