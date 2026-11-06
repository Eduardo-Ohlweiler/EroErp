package com.api.ero_api.auth.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Troca da própria senha")
public record TrocarSenhaDto(
        @NotBlank(message = "Senha atual é obrigatória") @Size(max = 128, message = "Senha inválida") String senhaAtual,
        @NotBlank(message = "Nova senha é obrigatória") @Size(max = 128, message = "Senha inválida") String novaSenha) {

    @Override
    public String toString() {
        return "TrocarSenhaDto[***]";
    }
}
