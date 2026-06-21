package com.api.ero_erp.otorrino.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ImitanciometriaResponseDto(
        Long          id,
        Long          pessoaId,
        String        pessoaNome,
        Long          usuarioId,
        String        usuarioNome,
        Long          consultaId,
        LocalDate     dataExame,

        String        curvaOd,
        String        curvaOe,
        Integer       picoPressaoOdDapa,
        Integer       picoPressaoOeDapa,
        BigDecimal    complacenciaOdMl,
        BigDecimal    complacenciaOeMl,
        BigDecimal    volumeCanalOdMl,
        BigDecimal    volumeCanalOeMl,
        String        reflexoIpsiOd,
        String        reflexoContraOd,
        String        reflexoIpsiOe,
        String        reflexoContraOe,

        String        observacao,

        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
