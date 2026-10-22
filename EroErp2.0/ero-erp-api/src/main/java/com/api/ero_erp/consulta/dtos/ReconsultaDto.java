package com.api.ero_erp.consulta.dtos;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

/** @param responsavelId nulo, o mesmo da consulta de origem */
public record ReconsultaDto(
        @NotNull(message = "Início é obrigatório")
        Instant inicio,

        @NotNull(message = "Fim é obrigatório")
        Instant fim,

        UUID responsavelId
) {}
