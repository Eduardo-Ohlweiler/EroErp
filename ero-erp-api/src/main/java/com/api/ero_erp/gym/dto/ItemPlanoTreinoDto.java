package com.api.ero_erp.gym.dto;

import com.api.ero_erp.gym.enums.DiaSemanaGym;
import com.api.ero_erp.gym.enums.TipoExecucao;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record ItemPlanoTreinoDto(

        @Schema(description = "Dia da semana")
        @NotNull(message = "Dia da semana é obrigatório")
        DiaSemanaGym diaSemana,

        @Schema(description = "Ordem de exibição dentro do dia")
        Integer ordem,

        @Schema(description = "ID do exercício — opcional")
        Long exercicioId,

        @Schema(description = "Número de séries", example = "4")
        Integer series,

        @Schema(description = "Número de repetições por série", example = "12" )
        String repeticoes,

        @Schema(description = "Tipo de execução: NORMAL, DROPSET ou DROPSET_INVERTIDO")
        TipoExecucao tipoExecucao,

        @Schema(description = "Tempo de pausa em segundos", example = "60")
        Integer pausaSegundos,

        @Schema(description = "Observação do item")
        String observacao

) {}
