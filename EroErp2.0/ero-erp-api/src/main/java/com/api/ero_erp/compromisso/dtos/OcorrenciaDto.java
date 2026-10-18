package com.api.ero_erp.compromisso.dtos;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

/** Uma data da série como ficou na prévia — editada, ou como o tipo a gerou. */
public record OcorrenciaDto(
        @NotNull(message = "Início da data é obrigatório")
        Instant inicio,

        @NotNull(message = "Fim da data é obrigatório")
        Instant fim
) {}
