package com.api.ero_erp.usuario.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UsuarioUpdateDto(

        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Email(message = "Email inválido")
        @Size(max = 255, message = "Email deve ter no máximo 255 caracteres")
        String email,

        String senha,

        @Pattern(
                regexp = "^\\d{10,11}$",
                message = "Telefone deve conter apenas números com DDD (10 ou 11 dígitos)"
        )
        String telefone,

        Boolean ativo,

        Set<Long> roleIds
) {}