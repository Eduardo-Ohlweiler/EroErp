package com.api.ero_erp.terapianutricional.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Dashboard geral (agregado) do módulo de Terapia Nutricional, com KPIs e distribuições.
 */
public record TerapiaNutricionalGeralDashboardDto(
        // ── KPIs ────────────────────────────────────────────────────────────────
        long       totalAvaliacoes,
        long       totalPacientes,        // distinct pessoa.id
        long       avaliacoesNoPeriodo,   // dataAvaliacao dentro da janela consultada
        BigDecimal mediaKcalKg,           // média de dietaKcalKg, scale 2
        BigDecimal mediaPtnKg,            // média de dietaPtnKg, scale 2

        List<ContagemDto> porClassificacaoImc,  // agrupa classifImcOms, desc
        List<ContagemDto> porFase,               // agrupa fase, desc
        List<ContagemDto> porFormula,            // agrupa formulaNome, top N desc
        List<ContagemDto> rankingPacientes       // top 10 por nº de avaliações
) {

    /** Contagem genérica rótulo → total, reutilizável nas distribuições. */
    public record ContagemDto(String label, long total) {}
}
