package com.api.ero_erp.usuario.dtos;

import com.api.ero_erp.config.validacao.SenhaBcrypt;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Senha nova definida pelo superadmin para quem perdeu a sua. */
public record SenhaRedefinicaoDto(

        @NotBlank(message = "Informe a nova senha")
        @Size(min = 10, message = "A senha deve ter no mínimo 10 caracteres")
        @SenhaBcrypt
        String senhaNova
) {}
