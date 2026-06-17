package com.api.ero_erp.pediatria.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Dashboard de um paciente (pessoa) específico no módulo de Pediatria.
 * Agrega cabeçalho, última avaliação, evolução temporal e histórico de fórmulas.
 */
public record PediatriaPacienteDashboardDto(
        // ── Cabeçalho do paciente ───────────────────────────────────────────────
        Long          pessoaId,
        String        pessoaNome,
        String        sexo,                 // da última avaliação (Pessoa não possui sexo)
        LocalDate     dataNascimento,       // de Pessoa, pode ser null
        Integer       idadeMesesAtual,      // calculada de dataNascimento; fallback: idadeMeses da última avaliação
        long          totalAvaliacoes,
        LocalDate     primeiraAvaliacao,    // menor dataAvaliacao
        LocalDate     ultimaAvaliacaoData,  // maior dataAvaliacao

        UltimaAvaliacaoDto       ultimaAvaliacao,
        List<PontoEvolutivoDto>  evolucao,
        List<HistoricoFormulaDto> historicoFormulas
) {

    /** Snapshot completo da avaliação mais recente (maior dataAvaliacao). */
    public record UltimaAvaliacaoDto(
            BigDecimal peso,
            BigDecimal estatura,
            BigDecimal imc,
            String     classifPesoIdade,
            String     classifEstaturaIdade,
            String     classifImcIdade,
            BigDecimal vet,
            BigDecimal proteinaNecessidade,
            String     formulaNome,
            BigDecimal caloriasTotais,
            BigDecimal proteinaTotal,
            BigDecimal percCalorico,
            BigDecimal percProteico,
            String     observacao,
            LocalDate  dataAvaliacao,
            Integer    idadeMeses
    ) {}

    /** Ponto da série evolutiva, ordenado por idadeMeses asc. */
    public record PontoEvolutivoDto(
            LocalDate  dataAvaliacao,
            Integer    idadeMeses,
            BigDecimal peso,
            BigDecimal estatura,
            BigDecimal imc,
            BigDecimal vet,
            BigDecimal caloriasTotais,
            BigDecimal proteinaTotal,
            BigDecimal proteinaNecessidade,
            BigDecimal percCalorico,
            BigDecimal percProteico,
            String     formulaNome,
            String     classifPesoIdade,
            String     classifEstaturaIdade,
            String     classifImcIdade
    ) {}

    /** Histórico de fórmulas lácteas prescritas (apenas avaliações com formulaNome != null). */
    public record HistoricoFormulaDto(
            LocalDate  dataAvaliacao,
            Integer    idadeMeses,
            String     formulaNome,
            BigDecimal volumeTotal,
            BigDecimal vezesDia
    ) {}
}
