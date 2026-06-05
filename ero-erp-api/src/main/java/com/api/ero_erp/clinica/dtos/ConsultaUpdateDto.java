package com.api.ero_erp.clinica.dtos;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ConsultaUpdateDto(

        @NotNull(message = "Emitente é obrigatório")
        Long emitenteId,

        @NotNull(message = "Pessoa (paciente) é obrigatória")
        Long pessoaId,

        @NotNull(message = "Início é obrigatório")
        LocalDateTime inicio,

        @NotNull(message = "Fim é obrigatório")
        LocalDateTime fim,

        String observacao,

        String     tipoAjusteGeral,
        String     tipoCalculoGeral,
        java.math.BigDecimal valorAjusteGeral
) {}
