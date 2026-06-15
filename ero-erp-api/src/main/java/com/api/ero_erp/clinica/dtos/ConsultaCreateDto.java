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

        // Compromisso da agenda a reaproveitar. Quando informado, o horário vem
        // do compromisso e inicio/fim são ignorados. Quando nulo, um novo
        // compromisso é criado a partir de inicio/fim.
        Long compromissoId,

        // Obrigatórios apenas quando compromissoId é nulo (validado na service).
        LocalDateTime inicio,

        LocalDateTime fim,

        String observacao,

        Long fichaAnamneseId,

        @Valid
        List<ConsultaServicoCreateDto> servicos
) {}
