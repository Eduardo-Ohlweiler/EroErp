package com.api.ero_erp.clinica.dto;

import com.api.ero_erp.clinica.enums.DiaSemana;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ItemPlanoAlimentarDto(

        @Schema(description = "Dia da semana", example = "SEGUNDA")
        @NotNull(message = "Dia da semana é obrigatório")
        DiaSemana diaSemana,

        @Schema(description = "Horário da refeição no formato HH:mm", example = "07:30")
        @NotBlank(message = "Horário é obrigatório")
        String horario,

        @Schema(description = "ID da refeição vinculada (opcional)")
        Long refeicaoId,

        @Schema(description = "Quantidade descritiva (ex: 1 xícara, 200ml)")
        String quantidade,

        @Schema(description = "Peso em gramas")
        BigDecimal peso,

        @Schema(description = "Observações sobre o item")
        String observacao

) {}
