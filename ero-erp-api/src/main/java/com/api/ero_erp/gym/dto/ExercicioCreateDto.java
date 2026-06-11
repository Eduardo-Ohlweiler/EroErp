package com.api.ero_erp.gym.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExercicioCreateDto(

        @Schema(description = "Nome do exercício", example = "Supino Reto")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 200, message = "Nome deve ter no máximo 200 caracteres")
        String nome,

        @Schema(description = "Descrição do exercício")
        String descricao,

        @Schema(description = "Indica se o exercício está ativo")
        Boolean ativo

) {}
