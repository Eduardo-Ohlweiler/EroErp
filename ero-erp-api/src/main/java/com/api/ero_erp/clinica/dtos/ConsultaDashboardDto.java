package com.api.ero_erp.clinica.dtos;

import java.math.BigDecimal;
import java.util.List;

public record ConsultaDashboardDto(

        long       totalConcluidas,
        long       concluidasEsteMes,
        BigDecimal receitaTotal,
        BigDecimal receitaMes,
        BigDecimal ticketMedio,

        List<ServicoRankingDto>  servicosMaisVendidos,
        List<DiaSemanaDto>       porDiaSemana,
        List<ClienteRankingDto>  clientesMaisVieis,
        List<DiaReceitaDto>      receitaUltimos30Dias
) {
    public record ServicoRankingDto(
            String     servicoNome,
            long       atendimentos,
            BigDecimal qtdTotal,
            BigDecimal precoMedio,
            BigDecimal receitaTotal
    ) {}

    public record DiaSemanaDto(
            String     diaSemana,
            long       atendimentos,
            BigDecimal receita
    ) {}

    public record ClienteRankingDto(
            String     pessoaNome,
            long       consultas,
            BigDecimal receitaTotal
    ) {}

    public record DiaReceitaDto(
            String     data,
            long       atendimentos,
            BigDecimal receita
    ) {}
}
