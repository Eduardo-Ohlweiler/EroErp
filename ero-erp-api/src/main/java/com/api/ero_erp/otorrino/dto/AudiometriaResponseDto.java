package com.api.ero_erp.otorrino.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record AudiometriaResponseDto(
        Long          id,
        Long          pessoaId,
        String        pessoaNome,
        Long          usuarioId,
        String        usuarioNome,
        Long          consultaId,
        LocalDate     dataExame,

        Integer       srtOdDb,
        Integer       srtOeDb,
        BigDecimal    irfOdPerc,
        BigDecimal    irfOePerc,

        // ── Resultados calculados (snapshot) ──
        BigDecimal    mediaOd,
        BigDecimal    mediaOe,
        String        grauOd,
        String        grauOe,
        String        tipoPerdaOd,
        String        tipoPerdaOe,
        String        norma,

        String        observacao,
        List<AudiometriaLimiarResponseDto> limiares,

        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
