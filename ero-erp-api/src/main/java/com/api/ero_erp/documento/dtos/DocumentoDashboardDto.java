package com.api.ero_erp.documento.dtos;

import java.math.BigDecimal;
import java.util.List;

public record DocumentoDashboardDto(
        long totalDocumentos, long totalEmitidos, long totalRascunhos, long totalCancelados,
        BigDecimal valorTotalEmitido, BigDecimal valorEmitidoMes, BigDecimal ticketMedio,
        List<StatusDistribuicaoDto> porStatus,
        List<PeriodoDto>            porPeriodo,
        List<EmitenteRankingDto>    porEmitente,
        List<CidadeRankingDto>      porCidade,
        List<PessoaRankingDto>      porPessoa
) {
    public record StatusDistribuicaoDto(String status, long quantidade, BigDecimal valor) {}
    public record PeriodoDto(String periodo, long quantidade, BigDecimal valor) {}            // periodo = "MM/yy"
    public record EmitenteRankingDto(Long emitenteId, String nome, String cor, long quantidade, BigDecimal valor) {}
    public record CidadeRankingDto(Long cidadeId, String nome, String uf, long quantidade, BigDecimal valor) {}
    public record PessoaRankingDto(Long pessoaId, String nome, long quantidade, BigDecimal valor) {}
}
