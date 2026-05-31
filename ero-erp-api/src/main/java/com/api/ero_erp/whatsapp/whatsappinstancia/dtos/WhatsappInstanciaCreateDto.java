package com.api.ero_erp.whatsapp.whatsappinstancia.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record WhatsappInstanciaCreateDto(
        @Schema(description = "Nome amigável da instância", example = "Comercial")
        @NotBlank(message = "Nome é obrigatório")
        String nome,

        @Schema(description = "ID do usuário vinculado à instância", example = "1")
        @NotNull(message = "Usuário é obrigatório")
        Long usuarioId,

        @Schema(description = "Nome da instância na Evolution API", example = "minha-empresa-comercial")
        @NotBlank(message = "Instance name é obrigatório")
        String instanceName,

        @Schema(description = "Token de autenticação da instância na Evolution API", example = "abc123token")
        String token,

        @Schema(description = "Fuso horário para envio dos lembretes", example = "America/Sao_Paulo")
        String timezone,

        @Schema(description = "Antecedência em minutos para envio de lembretes", example = "60")
        Integer antecedenciaMinutos,

        @Schema(description = "Indica se a instância está ativa", example = "true")
        Boolean ativo
) {}
