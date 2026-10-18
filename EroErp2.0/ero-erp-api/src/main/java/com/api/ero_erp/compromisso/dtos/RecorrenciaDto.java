package com.api.ero_erp.compromisso.dtos;

import com.api.ero_erp.compromisso.enums.TipoRecorrencia;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * @param quantidade quantas ocorrências, contando a primeira — o antigo não
 *                   tinha teto e gerava o que se digitasse
 */
public record RecorrenciaDto(
        @NotNull(message = "Informe o tipo de recorrência")
        TipoRecorrencia tipo,

        @NotNull(message = "Informe quantas vezes se repete")
        @Min(value = 2, message = "Recorrência tem ao menos 2 ocorrências")
        @Max(value = 52, message = "Recorrência tem no máximo 52 ocorrências")
        Integer quantidade
) {}
