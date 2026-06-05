package com.api.ero_erp.clinica.dtos;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ReconsultaCreateDto(

        @NotNull(message = "Início é obrigatório")
        LocalDateTime inicio,

        @NotNull(message = "Fim é obrigatório")
        LocalDateTime fim,

        Long emitenteId,

        String observacao
) {}
