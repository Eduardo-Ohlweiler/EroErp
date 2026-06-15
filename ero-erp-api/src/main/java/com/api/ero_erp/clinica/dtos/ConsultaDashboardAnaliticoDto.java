package com.api.ero_erp.clinica.dtos;

import java.math.BigDecimal;
import java.util.List;

public record ConsultaDashboardAnaliticoDto(
        long totalConsultas, long totalConcluidas, long totalCanceladas,
        long totalReconsultas,              // consultas no período com consultaPai != null
        BigDecimal taxaReconsulta,          // (totalReconsultas / totalConsultas) * 100, scale 1
        BigDecimal receitaTotal, BigDecimal receitaMes, BigDecimal ticketMedio,
        List<StatusDistribuicaoDto> porStatus,
        List<PeriodoDto>            porPeriodo,
        List<ServicoRankingDto>     servicosMaisVendidos,
        List<EmitenteRankingDto>    porEmitente,
        List<ClienteRankingDto>     clientesMaisFieis,
        List<DiaSemanaDto>          porDiaSemana
) {
    public record StatusDistribuicaoDto(String status, long quantidade) {}
    public record PeriodoDto(String periodo, long consultas, BigDecimal receita) {}   // periodo = "MM/yy"
    public record ServicoRankingDto(String servicoNome, long atendimentos, BigDecimal qtdTotal, BigDecimal precoMedio, BigDecimal receitaTotal) {}
    public record EmitenteRankingDto(Long emitenteId, String nome, String cor, long consultas, BigDecimal receita) {}
    public record ClienteRankingDto(Long pessoaId, String pessoaNome, long consultas, BigDecimal receitaTotal) {}
    public record DiaSemanaDto(String diaSemana, long atendimentos, BigDecimal receita) {}
}
