package com.api.ero_erp.crm.atendimento.dtos;

import jakarta.validation.constraints.NotNull;

/** Payload para vincular uma pessoa (cadastro existente) a um atendimento. */
public record VincularPessoaDto(
        @NotNull(message = "pessoaId é obrigatório")
        Long pessoaId
) {}
