package com.api.ero_erp.usuario.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UsuarioCreateDto(

        @Schema(description = "Nome do usuário", example = "Eduardo Rodrigo")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Schema(description = "Email do cliente", example = "eduardo@email.com")
        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Email inválido")
        @Size(max = 255, message = "Email deve ter no máximo 255 caracteres")
        String email,

        String senha,

        @Schema(description = "Telefone no formato DDD + número (somente números)", example = "51992006747")
        @NotBlank(message = "Telefone é obrigatório")
        @Pattern(
                regexp = "^\\d{10,11}$",
                message = "Telefone deve conter apenas números com DDD (10 ou 11 dígitos)"
        )
        String telefone,

        @Schema(
                description = "IDs das roles do usuário",
                example = "[1, 2]"
        )
        Set<Long> roleIds
) {}
