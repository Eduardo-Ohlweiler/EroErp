package com.api.ero_api.auth.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Pede o reenvio do MESMO código para o e-mail do usuário do desafio. */
@Schema(description = "Reenvio do código da verificação em duas etapas")
public record DoisFatoresReenviarDto(
        @NotBlank(message = "Desafio é obrigatório") @Size(max = 2000, message = "Desafio inválido") String desafio) {

    @Override
    public String toString() {
        return "DoisFatoresReenviarDto[***]";
    }
}
