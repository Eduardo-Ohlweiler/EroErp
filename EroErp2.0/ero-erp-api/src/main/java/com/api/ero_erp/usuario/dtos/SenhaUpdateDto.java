package com.api.ero_erp.usuario.dtos;

import com.api.ero_erp.config.validacao.SenhaBcrypt;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SenhaUpdateDto(

        @NotBlank(message = "Informe a senha atual")
        @SenhaBcrypt
        String senhaAtual,

        @NotBlank(message = "Informe a nova senha")
        @Size(min = 10, message = "A senha deve ter no mínimo 10 caracteres")
        @SenhaBcrypt
        String senhaNova
) {}
