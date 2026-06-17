package com.api.ero_erp.pediatria.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Dashboard geral (agregado) do módulo de Pediatria, com KPIs e distribuições.
 */
public record PediatriaGeralDashboardDto(
        // ── KPIs ────────────────────────────────────────────────────────────────
        long       totalAvaliacoes,
        long       totalPacientes,           // distinct pessoa.id
        long       avaliacoesMes,            // dataAvaliacao no mês corrente
        BigDecimal idadeMediaMeses,          // scale 1
        BigDecimal pesoMedio,                // scale 2
        BigDecimal imcMedio,                 // scale 2
        BigDecimal percImcAdequado,          // % das avaliações com classifImcIdade adequado, scale 1
        BigDecimal coberturaCaloricaMedia,   // média de percCalorico, scale 1

        List<PeriodoDto>          porPeriodo,             // buckets mensais contínuos (12 meses)
        List<ClassificacaoDto>    porClassifPesoIdade,
        List<ClassificacaoDto>    porClassifEstaturaIdade,
        List<ClassificacaoDto>    porClassifImcIdade,
        List<FormulaDto>          porFormula,             // desc por quantidade
        List<FaixaEtariaDto>      porFaixaEtaria,         // faixas fixas, inclui zeros
        List<SexoDto>             porSexo,
        List<PacienteRankingDto>  pacientesMaisAvaliados  // top 10 desc
) {

    public record PeriodoDto(String periodo, long avaliacoes) {}            // periodo = "MM/yy"

    public record ClassificacaoDto(String classificacao, long quantidade) {}

    public record FormulaDto(String formulaNome, long quantidade) {}

    public record FaixaEtariaDto(String faixa, long quantidade) {}          // ex.: "0-6", "60+"

    public record SexoDto(String sexo, long quantidade) {}

    public record PacienteRankingDto(Long pessoaId, String pessoaNome, long avaliacoes) {}
}
