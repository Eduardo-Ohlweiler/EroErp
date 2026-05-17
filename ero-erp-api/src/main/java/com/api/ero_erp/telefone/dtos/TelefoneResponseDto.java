package com.api.ero_erp.telefone.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public record TelefoneResponseDto(

        @Schema(description = "ID do telefone", example = "10")
        Long id,

        @Schema(description = "ID da pessoa", example = "1")
        Long pessoaId,

        @Schema(description = "ID do tipo de telefone", example = "2")
        Long tipoTelefoneId,

        @Schema(description = "Descrição do tipo de telefone", example = "Comercial")
        String tipoTelefoneNome,

        @Schema(description = "Numero do telefone", example = "51992006747")
        String numero,

        @Schema(description = "Observação")
        String observacao,

        @Schema(description = "Indica se é o principal", example = "true")
        Boolean principal,

        @Schema(description = "Data de criação", example = "2026-05-05T10:15:30")
        LocalDateTime createdAt,

        @Schema(description = "Data de atualização", example = "2026-05-05T11:20:00")
        LocalDateTime updatedAt
) {
}
