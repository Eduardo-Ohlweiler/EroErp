package com.api.ero_api.auth.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Segunda etapa do login: o desafio recebido + o código enviado por e-mail. */
@Schema(description = "Código da verificação em duas etapas")
public record DoisFatoresVerificarDto(
        @NotBlank(message = "Desafio é obrigatório") @Size(max = 2000, message = "Desafio inválido") String desafio,
        @Schema(description = "6 dígitos recebidos por e-mail", example = "123456")
        @NotBlank(message = "Código é obrigatório") @Size(max = 20, message = "Código inválido") String codigo) {

    @Override
    public String toString() {
        return "DoisFatoresVerificarDto[***]";
    }
}
