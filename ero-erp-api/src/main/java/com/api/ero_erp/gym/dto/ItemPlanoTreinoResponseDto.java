package com.api.ero_erp.gym.dto;

import com.api.ero_erp.gym.enums.DiaSemanaGym;
import com.api.ero_erp.gym.enums.TipoExecucao;

public record ItemPlanoTreinoResponseDto(
        Long         id,
        DiaSemanaGym diaSemana,
        int          ordem,
        Long         exercicioId,
        String       exercicioNome,
        Integer      series,
        String       repeticoes,
        TipoExecucao tipoExecucao,
        Integer      pausaSegundos,
        String       observacao
) {}
