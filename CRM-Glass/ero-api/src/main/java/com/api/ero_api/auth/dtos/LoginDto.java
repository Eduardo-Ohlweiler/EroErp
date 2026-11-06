package com.api.ero_api.auth.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Credenciais de acesso")
public record LoginDto(
        @Schema(example = "marina@empresa.com.br")
        @NotBlank(message = "E-mail é obrigatório")
        @Size(max = 255, message = "E-mail inválido")
        String email,

        @NotBlank(message = "Senha é obrigatória")
        @Size(max = 128, message = "Senha inválida")
        String senha) {

    @Override
    public String toString() {
        return "LoginDto[***]";
    }
}
