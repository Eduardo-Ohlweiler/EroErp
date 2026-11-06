package com.api.ero_api.auth.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Ligar o 2FA pede a senha: sem isso, quem pegasse uma sessão aberta cadastraria
 * o próprio celular e trancaria o dono da conta para fora.
 */
@Schema(description = "Confirmação para ligar a verificação em duas etapas")
public record DoisFatoresAtivarDto(
        @NotBlank(message = "Senha é obrigatória") @Size(max = 128, message = "Senha inválida") String senha,
        @Schema(example = "123456")
        @NotBlank(message = "Código é obrigatório") @Size(max = 20, message = "Código inválido") String codigo) {

    @Override
    public String toString() {
        return "DoisFatoresAtivarDto[***]";
    }
}
