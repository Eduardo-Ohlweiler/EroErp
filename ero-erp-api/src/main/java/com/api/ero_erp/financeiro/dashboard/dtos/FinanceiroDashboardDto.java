package com.api.ero_erp.financeiro.dashboard.dtos;

import java.math.BigDecimal;
import java.util.List;

public record FinanceiroDashboardDto(
        BigDecimal totalPendenteReceber,
        BigDecimal totalPendenteAtrasadoReceber,
        BigDecimal totalPendentePagar,
        BigDecimal totalPendenteAtrasadoPagar,
        BigDecimal totalRecebidoMes,
        BigDecimal totalPagoMes,
        BigDecimal saldoGeral,
        List<FluxoMensalDto> fluxoMensal,
        List<SaldoContaDto> saldoPorConta
) {
    public record FluxoMensalDto(String mes, BigDecimal recebido, BigDecimal pago) {}
    public record SaldoContaDto(String nome, BigDecimal saldo) {}
}
