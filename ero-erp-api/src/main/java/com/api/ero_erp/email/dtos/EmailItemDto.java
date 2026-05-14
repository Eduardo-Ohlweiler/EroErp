package com.api.ero_erp.email.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EmailItemDto(

        @Schema(description = "ID do email (null para novos)", example = "10")
        Long id,

        @Schema(description = "ID do tipo de email", example = "2")
        @NotNull(message = "Tipo de email é obrigatório")
        Long tipoEmailId,

        @Schema(description = "Endereço de e-mail", example = "teste@email.com")
        @NotNull(message = "Email é obrigatório")
        @Email(message = "Email inválido")
        @Size(max = 255)
        String email,

        @Schema(description = "Observação")
        @Size(max = 255)
        String observacao,

        @Schema(description = "É o email principal?", example = "true")
        Boolean principal
) {}