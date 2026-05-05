package com.api.ero_erp.email.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public record EmailResponseDto(

        @Schema(description = "ID do email", example = "10")
        Long id,

        @Schema(description = "ID do cliente", example = "1")
        Long clienteId,

        @Schema(description = "ID da pessoa", example = "1")
        Long pessoaId,

        @Schema(description = "Nome da pessoa", example = "João da Silva")
        String pessoaNome,

        @Schema(description = "ID do tipo de email", example = "2")
        Long tipoEmailId,

        @Schema(description = "Descrição do tipo de email", example = "Comercial")
        String tipoEmailDescricao,

        @Schema(description = "Endereço de e-mail", example = "teste@email.com")
        String email,

        @Schema(description = "Indica se é o principal", example = "true")
        Boolean principal,

        @Schema(description = "Data de criação", example = "2026-05-05T10:15:30")
        LocalDateTime createdAt,

        @Schema(description = "Data de atualização", example = "2026-05-05T11:20:00")
        LocalDateTime updatedAt

) {
}
