package com.api.ero_erp.cliente.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ClienteUpdateDto(

        @Schema(description = "Nome do cliente", example = "Eduardo Ohlweiler")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Schema(description = "Telefone no formato DDD + número (somente números)", example = "51992006747")
        @Pattern(
                regexp = "^\\d{10,11}$",
                message = "Telefone deve conter apenas números com DDD (10 ou 11 dígitos)"
        )
        String telefone,

        @Schema(description = "Código do país (DDI, somente números). Padrão 55 (Brasil) quando não informado.", example = "55")
        @Pattern(
                regexp = "^\\d{1,4}$",
                message = "Código do país deve conter apenas números (1 a 4 dígitos)"
        )
        String codigoPais,

        @Schema(description = "Email do cliente", example = "eduardo@email.com")
        @Email(message = "Email inválido")
        @Size(max = 255, message = "Email deve ter no máximo 255 caracteres")
        String email,

        @Schema(description = "Definir se o cliente esta ativo", example = "true")
        Boolean ativo
) {}
