package com.api.ero_erp.clinica.dtos;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record RemarcarSessaoDto(
        @NotNull LocalDateTime inicio,
        @NotNull LocalDateTime fim
) {}
