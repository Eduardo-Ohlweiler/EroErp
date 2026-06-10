package com.api.ero_erp.clinica.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record RespostaAnamneseDto(

        @Schema(description = "ID do campo respondido")
        @NotNull(message = "Campo ID é obrigatório")
        Long campoId,

        @Schema(description = "Valor da resposta")
        String valor

) {}
