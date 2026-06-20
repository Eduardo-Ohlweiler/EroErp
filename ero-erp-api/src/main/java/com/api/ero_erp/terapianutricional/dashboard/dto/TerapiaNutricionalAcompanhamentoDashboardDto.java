package com.api.ero_erp.terapianutricional.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Painel de Acompanhamento Diário de um paciente no módulo de Terapia Nutricional.
 * Agrega cabeçalho, último registro e evolução diária dos Registros Diários UTI.
 */
public record TerapiaNutricionalAcompanhamentoDashboardDto(
        // ── Cabeçalho do paciente ───────────────────────────────────────────────
        Long      pessoaId,
        String    pessoaNome,
        long      totalRegistros,
        LocalDate primeiroRegistro,   // menor data
        LocalDate ultimoRegistroData, // maior data

        UltimoRegistroDto    ultimoRegistro,
        List<PontoDiarioDto> evolucao
) {

    /** Snapshot do registro diário mais recente (maior data). */
    public record UltimoRegistroDto(
            LocalDate  data,
            String     dieta,
            BigDecimal percRecebidoNe,
            BigDecimal volPrescrito24h,
            BigDecimal volRecebido24h,
            BigDecimal ingestaoMedia,
            BigDecimal bh,
            BigDecimal diurese,
            BigDecimal k,
            BigDecimal na,
            BigDecimal mg,
            BigDecimal lact,
            BigDecimal pcr,
            BigDecimal ph,
            BigDecimal pco2,
            BigDecimal hco3
    ) {}

    /** Ponto da série diária, ordenado por data asc. */
    public record PontoDiarioDto(
            LocalDate  data,
            BigDecimal volPrescrito24h,
            BigDecimal volRecebido24h,
            BigDecimal percRecebidoNe,
            BigDecimal ingestaoMedia,
            BigDecimal k,
            BigDecimal na,
            BigDecimal mg,
            BigDecimal lact,
            BigDecimal pcr,
            BigDecimal ph,
            BigDecimal pco2,
            BigDecimal hco3,
            BigDecimal bh,
            BigDecimal diurese
    ) {}
}
