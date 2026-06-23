package com.api.ero_erp.clinica.dtos;

import com.api.ero_erp.clinica.enums.StatusConsulta;

import java.time.LocalDateTime;

public record SessaoResumoDto(
        Long           consultaId,
        Integer        sessao,
        StatusConsulta status,
        LocalDateTime  inicio,
        LocalDateTime  fim
) {}
