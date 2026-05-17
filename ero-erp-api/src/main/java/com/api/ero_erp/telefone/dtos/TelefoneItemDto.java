package com.api.ero_erp.telefone.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

public record TelefoneItemDto(

        @Schema(description = "ID do telefone (null para novos)", example = "10")
        Long id,

        @Schema(description = "ID do tipo de telefone", example = "2")
        @NotNull(message = "Tipo de telefone é obrigatório")
        Long tipoTelefoneId,

        @Schema(description = "Telefone no formato DDD + número (somente números)", example = "51992006747")
        @NotBlank(message = "Telefone é obrigatório")
        @Pattern(
                regexp = "^\\d{10,11}$",
                message = "Telefone deve conter apenas números com DDD (10 ou 11 dígitos)"
        )
        String telefone,

        @Schema(description = "Observação")
        @Size(max = 255)
        String observacao,

        @Schema(description = "É o telefone principal?", example = "true")
        Boolean principal
) {
}
