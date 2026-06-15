package com.api.ero_erp.financeiro.dashboard.dtos;

import java.math.BigDecimal;
import java.util.List;

public record FinanceiroFluxoDashboardDto(
        String regime,                 // "CAIXA" | "COMPETENCIA"
        BigDecimal totalCreditos,
        BigDecimal totalDebitos,
        BigDecimal saldoPeriodo,       // totalCreditos - totalDebitos
        long qtdCreditos,
        long qtdDebitos,
        List<FluxoPeriodoDto>  porPeriodo,
        List<PessoaFluxoDto>   porPessoa,
        List<EmitenteFluxoDto> porEmitente
) {
    public record FluxoPeriodoDto(String periodo, BigDecimal creditos, BigDecimal debitos, BigDecimal saldo) {} // periodo = "MM/yy"
    public record PessoaFluxoDto(Long pessoaId, String nome, BigDecimal creditos, BigDecimal debitos) {}
    public record EmitenteFluxoDto(Long emitenteId, String nome, String cor, BigDecimal creditos, BigDecimal debitos) {}
}
