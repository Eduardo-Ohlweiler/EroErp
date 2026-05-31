package com.api.ero_erp.whatsapp.whatsappinstancia.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public record WhatsappInstanciaResponseDto(
        @Schema(description = "ID da instância", example = "1")
        Long id,

        @Schema(description = "ID do cliente", example = "1")
        Long clienteId,

        @Schema(description = "ID do usuário", example = "1")
        Long usuarioId,

        @Schema(description = "Nome do usuário", example = "Eduardo")
        String usuarioNome,

        @Schema(description = "Numero de telefone do usuário", example = "Eduardo")
        String usuarioTelefone,

        @Schema(description = "Nome amigável da instância", example = "Comercial")
        String nome,

        @Schema(description = "Nome da instância na Evolution API", example = "minha-empresa-comercial")
        String instanceName,

        @Schema(description = "Token de autenticação da instância", example = "abc123token")
        String token,

        @Schema(description = "Fuso horário para envio dos lembretes", example = "America/Sao_Paulo")
        String timezone,

        @Schema(description = "Antecedência em minutos para envio de lembretes", example = "60")
        Integer antecedenciaMinutos,

        @Schema(description = "Indica se a instância está ativa", example = "true")
        Boolean ativo,

        @Schema(description = "Data de criação")
        LocalDateTime createdAt,

        @Schema(description = "Data de atualização")
        LocalDateTime updatedAt
) {}
