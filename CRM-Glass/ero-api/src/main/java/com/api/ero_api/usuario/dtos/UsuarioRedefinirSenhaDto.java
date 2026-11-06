package com.api.ero_api.usuario.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Administrador define uma senha temporária para outro usuário. */
@Schema(description = "Nova senha temporária")
public record UsuarioRedefinirSenhaDto(

        @Schema(description = "Senha temporária (mínimo 12 caracteres)")
        @NotBlank(message = "Senha é obrigatória")
        @Size(max = 128, message = "Senha deve ter no máximo 128 caracteres")
        String novaSenha) {

    @Override
    public String toString() {
        return "UsuarioRedefinirSenhaDto[***]";
    }
}
