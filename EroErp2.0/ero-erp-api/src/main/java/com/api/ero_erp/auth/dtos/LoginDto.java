package com.api.ero_erp.auth.dtos;

import com.api.ero_erp.config.validacao.SenhaBcrypt;
import jakarta.validation.constraints.NotBlank;

public record LoginDto(

        @NotBlank(message = "Informe o e-mail")
        String email,

        @NotBlank(message = "Informe a senha")
        @SenhaBcrypt
        String senha
) {}
