package com.api.ero_erp.crm.atendimento.dtos;

import jakarta.validation.constraints.NotNull;

public record MoverAndamentoDto(
        @NotNull(message = "Andamento é obrigatório")
        Long andamentoId
) {}
