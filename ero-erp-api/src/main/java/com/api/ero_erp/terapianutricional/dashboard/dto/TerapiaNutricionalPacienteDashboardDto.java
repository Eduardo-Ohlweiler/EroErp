package com.api.ero_erp.terapianutricional.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Dashboard de um paciente (pessoa) específico no módulo de Terapia Nutricional.
 * Agrega cabeçalho, última avaliação e evolução longitudinal das avaliações.
 */
public record TerapiaNutricionalPacienteDashboardDto(
        // ── Cabeçalho do paciente ───────────────────────────────────────────────
        Long      pessoaId,
        String    pessoaNome,
        long      totalAvaliacoes,
        LocalDate primeiraAvaliacao,   // menor dataAvaliacao
        LocalDate ultimaAvaliacaoData, // maior dataAvaliacao

        UltimaAvaliacaoDto      ultimaAvaliacao,
        List<PontoEvolutivoDto> evolucao
) {

    /** Snapshot da avaliação mais recente (maior dataAvaliacao). */
    public record UltimaAvaliacaoDto(
            BigDecimal pesoAtual,
            BigDecimal imc,
            String     classifImcOms,
            BigDecimal pesoIdeal,
            BigDecimal pesoAjustado,
            BigDecimal percAdequacaoCb,
            BigDecimal kcalTotal,
            BigDecimal ptnTotal,
            BigDecimal dietaKcal,
            BigDecimal dietaPtn,
            BigDecimal percVct,
            BigDecimal percPtn,
            String     formulaNome,
            LocalDate  dataAvaliacao
    ) {}

    /** Ponto da série evolutiva, ordenado por dataAvaliacao asc. */
    public record PontoEvolutivoDto(
            LocalDate  dataAvaliacao,
            BigDecimal pesoAtual,
            BigDecimal imc,
            BigDecimal percAdequacaoCb,
            BigDecimal kcalTotal,
            BigDecimal ptnTotal,
            BigDecimal dietaKcal,
            BigDecimal dietaPtn,
            BigDecimal percVct,
            BigDecimal percPtn,
            BigDecimal cb,
            BigDecimal cp
    ) {}
}
