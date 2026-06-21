package com.api.ero_erp.otorrino.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Dashboard de um paciente (pessoa) específico no módulo de Otorrinolaringologia.
 * Agrega evolução audiométrica, evolução das escalas/questionários, contagens e a última audiometria.
 */
public record OtorrinoPacienteDashboardDto(
        Long pessoaId,
        String pessoaNome,

        List<AudiometriaPontoDto> audiometriaEvolucao,   // ordenado por data ASC
        List<EscalaPontoDto>      escalaEvolucao,         // ordenado por data ASC
        ResumoDto                 resumo,
        UltimaAudiometriaDto      ultimaAudiometria       // pode ser null
) {

    /** Ponto da série evolutiva de audiometrias (usa snapshot gravado na entidade). */
    public record AudiometriaPontoDto(
            LocalDate  data,
            BigDecimal mediaOd,
            BigDecimal mediaOe,
            String     grauOd,
            String     grauOe
    ) {}

    /** Ponto da série evolutiva de uma escala/questionário aplicado. */
    public record EscalaPontoDto(
            LocalDate data,
            String    codigo,
            String    nome,
            Integer   scoreTotal,
            String    classificacao
    ) {}

    /** Contagens totais do paciente. */
    public record ResumoDto(
            long totalAudiometrias,
            long totalImitanciometrias,
            long totalEscalas,
            long totalLaudos
    ) {}

    /** Snapshot da audiometria mais recente do paciente. */
    public record UltimaAudiometriaDto(
            LocalDate data,
            String    grauOd,
            String    grauOe
    ) {}
}
