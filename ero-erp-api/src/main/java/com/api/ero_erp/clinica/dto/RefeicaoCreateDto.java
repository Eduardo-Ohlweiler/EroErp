package com.api.ero_erp.clinica.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RefeicaoCreateDto(

        @Schema(description = "Nome da refeição", example = "Café da manhã")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Schema(description = "Descrição da refeição")
        String descricao,

        @Schema(description = "Indica se a refeição está ativa")
        Boolean ativo

) {}
