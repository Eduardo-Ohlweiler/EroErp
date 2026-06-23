package com.api.ero_erp.clinica.dtos;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record SessaoSlotDto(
        @NotNull(message = "Início da sessão é obrigatório")
        LocalDateTime inicio,

        @NotNull(message = "Fim da sessão é obrigatório")
        LocalDateTime fim
) {}
