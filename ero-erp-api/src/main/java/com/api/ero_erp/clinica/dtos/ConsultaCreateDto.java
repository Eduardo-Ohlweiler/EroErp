package com.api.ero_erp.clinica.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public record ConsultaCreateDto(

        @NotNull(message = "Emitente é obrigatório")
        Long emitenteId,

        @NotNull(message = "Pessoa (paciente) é obrigatória")
        Long pessoaId,

        @NotNull(message = "Início é obrigatório")
        LocalDateTime inicio,

        @NotNull(message = "Fim é obrigatório")
        LocalDateTime fim,

        String observacao,

        Long fichaAnamneseId,

        @Valid
        List<ConsultaServicoCreateDto> servicos
) {}
