package com.api.ero_erp.usuario.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
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

        @Schema(
                description = "Nome das roles do usuário",
                example = "[SUPERADMIN, ADMIN]"
        )
        Set<String> roleIds
) {}