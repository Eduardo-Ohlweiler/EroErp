package com.api.ero_erp.usuario.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Senha nova definida pelo superadmin para quem perdeu a sua. */
public record SenhaRedefinicaoDto(

        @NotBlank(message = "Informe a nova senha")
        @Size(min = 10, max = 72, message = "A senha deve ter entre 10 e 72 caracteres")
        String senhaNova
) {}
