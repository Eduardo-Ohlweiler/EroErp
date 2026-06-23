package com.api.ero_erp.pedido.dtos;

import java.math.BigDecimal;
import java.util.List;

public record PedidoDashboardDto(
        long totalPedidos, long totalAbertos, long totalConcluidos, long totalCancelados,
        BigDecimal valorTotal, BigDecimal valorMes, BigDecimal ticketMedio,
        List<StatusDistribuicaoDto> porStatus,
        List<PeriodoDto>            porPeriodo,
        List<TipoPedidoRankingDto>  porTipoPedido,
        List<ProdutoRankingDto>     produtosMaisVendidos,
        List<EmitenteRankingDto>    porEmitente,
        List<ClienteRankingDto>     clientesMaisFieis,
        List<DiaSemanaDto>          porDiaSemana
) {
    public record StatusDistribuicaoDto(String status, long quantidade) {}
    public record PeriodoDto(String periodo, long pedidos, BigDecimal valor) {}   // periodo = "MM/yy"
    public record TipoPedidoRankingDto(String tipoPedidoNome, long pedidos, BigDecimal valor) {}
    public record ProdutoRankingDto(String produtoNome, long pedidos, BigDecimal qtdTotal, BigDecimal valorTotal) {}
    public record EmitenteRankingDto(Long emitenteId, String nome, String cor, long pedidos, BigDecimal valor) {}
    public record ClienteRankingDto(Long pessoaId, String pessoaNome, long pedidos, BigDecimal valor) {}
    public record DiaSemanaDto(String diaSemana, long pedidos, BigDecimal valor) {}
}
