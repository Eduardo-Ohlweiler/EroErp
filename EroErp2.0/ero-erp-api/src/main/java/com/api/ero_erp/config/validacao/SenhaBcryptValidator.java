package com.api.ero_erp.config.validacao;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.nio.charset.StandardCharsets;

public class SenhaBcryptValidator implements ConstraintValidator<SenhaBcrypt, String> {

    @Override
    public boolean isValid(String senha, ConstraintValidatorContext contexto) {
        return cabe(senha);
    }

    /** Nulo cabe: ausência é do {@code @NotBlank}. */
    public static boolean cabe(String senha) {
        return senha == null
                || senha.getBytes(StandardCharsets.UTF_8).length <= SenhaBcrypt.MAXIMO_BYTES;
    }
}
