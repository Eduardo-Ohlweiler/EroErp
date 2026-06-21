package com.api.ero_erp.otorrino.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Dashboard geral (agregado) do módulo de Otorrinolaringologia, com KPIs e distribuições.
 */
public record OtorrinoGeralDashboardDto(
        KpisDto kpis,

        List<ExameTipoDto>        examesPorTipo,         // Audiometria/Imitanciometria/Escala/Laudo
        List<PeriodoDto>          audiometriasPorPeriodo, // GROUP BY "YYYY-MM" da dataExame
        List<GrauPerdaDto>        distribuicaoGrauPerda,  // conta grauOd e grauOe (cada orelha)
        List<EscalaTipoDto>       escalasPorTipo,         // agrupado por questionário
        List<LaudoTipoDto>        laudosPorTipo           // agrupado por tipoExame
) {

    public record KpisDto(
            long totalAudiometrias,
            long totalImitanciometrias,
            long totalEscalas,
            long totalLaudos,
            long totalPacientes          // distinct pessoaId em todos os exames
    ) {}

    public record ExameTipoDto(String tipo, long total) {}

    public record PeriodoDto(String periodo, long total) {}   // periodo = "YYYY-MM"

    public record GrauPerdaDto(String classificacao, long quantidade) {}

    public record EscalaTipoDto(String codigo, String nome, long quantidade, BigDecimal scoreMedio) {}

    public record LaudoTipoDto(String tipo, long total) {}
}
