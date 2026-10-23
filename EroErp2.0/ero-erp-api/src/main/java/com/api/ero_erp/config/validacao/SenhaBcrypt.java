package com.api.ero_erp.config.validacao;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * A senha cabe no BCrypt: no máximo 72 <b>bytes</b> em UTF-8.
 *
 * <p>O BCrypt só lê os primeiros 72 bytes, e o Spring Security recusa com
 * {@code IllegalArgumentException} o que passa disso — sem esta guarda, a
 * exceção cai no catch-all e vira 500. Contar caracteres com
 * {@code @Size(max = 72)} não basta: letras acentuadas ocupam 2 bytes, e 40
 * "é" cabem nos 72 caracteres e estouram o encoder.
 *
 * <p>Nulo é válido aqui: ausência é assunto do {@code @NotBlank}. O piso de
 * tamanho continua no {@code @Size(min = 10)} de cada DTO. A regra mora em
 * {@link SenhaBcryptValidator#cabe(String)}, que o {@code DataSeeder} também
 * usa (anotação não pode ter método com corpo).
 */
@Documented
@Constraint(validatedBy = SenhaBcryptValidator.class)
@Target({ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface SenhaBcrypt {

    int MAXIMO_BYTES = 72;

    String MENSAGEM = "A senha passa de 72 bytes: letras acentuadas e símbolos ocupam 2 ou mais; "
            + "use menos caracteres";

    String message() default MENSAGEM;

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
