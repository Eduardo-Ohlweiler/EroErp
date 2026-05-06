package com.api.ero_erp.email.dtos;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EmailUpdateDto(
        @Schema(description = "ID da pessoa", example = "1")
        @NotNull(message = "Pessoa é obrigatória")
        Long pessoaId,

        @Schema(description = "ID do tipo de email", example = "2")
        @NotNull(message = "Tipo de email é obrigatório")
        Long tipoEmailId,

        @Schema(description = "Endereço de e-mail", example = "novo@email.com")
        @NotNull(message = "Email é obrigatório")
        @Email(message = "Email inválido")
        @Size(max = 255, message = "Email deve ter no máximo 255 caracteres")
        String email,

        @Schema(description = "Observação do e-email")
        @Size(max = 255, message = "Observação deve ter no máximo 255 caracteres")
        String observacao,

        @Schema(description = "Indica se é o email principal", example = "true")
        Boolean principal
) {
}
