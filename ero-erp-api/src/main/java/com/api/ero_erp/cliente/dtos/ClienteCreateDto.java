package com.api.ero_erp.cliente.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

public record ClienteCreateDto(

        @Schema(description = "Nome do cliente", example = "Eduardo Ohlweiler")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Schema(description = "Telefone no formato DDD + número (somente números)", example = "51992006747")
        @NotBlank(message = "Telefone é obrigatório")
        @Pattern(
                regexp = "^\\d{10,11}$",
                message = "Telefone deve conter apenas números com DDD (10 ou 11 dígitos)"
        )
        String telefone,

        @Schema(description = "Email do cliente", example = "eduardo@email.com")
        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Email inválido")
        @Size(max = 255, message = "Email deve ter no máximo 255 caracteres")
        String email
) {}
