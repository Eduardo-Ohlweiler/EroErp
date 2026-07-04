package com.api.ero_erp.usuario.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PerfilUpdateDto(

        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Email(message = "Email inválido")
        @Size(max = 255, message = "Email deve ter no máximo 255 caracteres")
        String email,

        @Pattern(
                regexp = "^\\d{10,11}$",
                message = "Telefone deve conter apenas números com DDD (10 ou 11 dígitos)"
        )
        String telefone,

        @Pattern(
                regexp = "^\\d{1,4}$",
                message = "Código do país deve conter apenas números (1 a 4 dígitos)"
        )
        String codigoPais,

        String senhaAtual,

        @Size(min = 6, max = 255, message = "Nova senha deve ter entre 6 e 255 caracteres")
        String novaSenha
) {}
