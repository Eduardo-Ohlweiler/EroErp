package com.api.ero_api.auth.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Desligar o 2FA pede senha + código, para quem pegou o computador aberto não conseguir. */
@Schema(description = "Confirmação para desligar a verificação em duas etapas")
public record DoisFatoresDesativarDto(
        @NotBlank(message = "Senha é obrigatória") @Size(max = 128, message = "Senha inválida") String senha,
        @NotBlank(message = "Código é obrigatório") @Size(max = 20, message = "Código inválido") String codigo) {

    @Override
    public String toString() {
        return "DoisFatoresDesativarDto[***]";
    }
}
