package com.api.ero_erp.financeiro.dashboard.service;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.financeiro.contafinanceira.entity.ContaFinanceira;
import com.api.ero_erp.financeiro.contafinanceira.repository.ContaFinanceiraRepository;
import com.api.ero_erp.financeiro.contapagar.entity.ParcelaContaPagar;
import com.api.ero_erp.financeiro.contapagar.repository.ParcelaContaPagarRepository;
import com.api.ero_erp.financeiro.contareceber.entity.ParcelaContaReceber;
import com.api.ero_erp.financeiro.contareceber.repository.ParcelaContaReceberRepository;
import com.api.ero_erp.financeiro.dashboard.dtos.FinanceiroDashboardDto;
import com.api.ero_erp.financeiro.dashboard.dtos.FinanceiroDashboardDto.FluxoMensalDto;
import com.api.ero_erp.financeiro.dashboard.dtos.FinanceiroDashboardDto.SaldoContaDto;
import com.api.ero_erp.financeiro.enums.StatusConta;
import com.api.ero_erp.financeiro.enums.TipoLancamento;
import com.api.ero_erp.financeiro.lancamento.entity.LancamentoFinanceiro;
import com.api.ero_erp.financeiro.lancamento.repository.LancamentoFinanceiroRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
public class FinanceiroDashboardService {

    private static final String[] MESES_PT = {
            "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    };

    private final ParcelaContaReceberRepository parcelaReceberRepo;
    private final ParcelaContaPagarRepository parcelaContaPagarRepo;
    private final ContaFinanceiraRepository contaFinanceiraRepo;
    private final LancamentoFinanceiroRepository lancamentoRepo;
    private final SecurityUtils securityUtils;

    public FinanceiroDashboardService(
            ParcelaContaReceberRepository   parcelaReceberRepo,
            ParcelaContaPagarRepository     parcelaContaPagarRepo,
            ContaFinanceiraRepository       contaFinanceiraRepo,
            LancamentoFinanceiroRepository  lancamentoRepo,
            SecurityUtils                   securityUtils
    ) {
        this.parcelaReceberRepo     = parcelaReceberRepo;
        this.parcelaContaPagarRepo  = parcelaContaPagarRepo;
        this.contaFinanceiraRepo    = contaFinanceiraRepo;
        this.lancamentoRepo         = lancamentoRepo;
        this.securityUtils          = securityUtils;
    }

    @Transactional(readOnly = true)
    public FinanceiroDashboardDto getDashboard() {
        Long clienteId = securityUtils.getClienteIdLogado();
        LocalDate hoje = LocalDate.now();

        List<ParcelaContaReceber> todasReceber = parcelaReceberRepo.findForPagarContas(clienteId,    null, null, null, null, null);
        List<ParcelaContaPagar>   todasPagar   = parcelaContaPagarRepo.findForPagarContas(clienteId, null, null, null, null, null);

        // Cards - pendentes (valor face)
        BigDecimal pendenteReceber = todasReceber.stream()
                .filter(p -> p.getStatus() == StatusConta.ABERTO)
                .map(   p -> p.getValor()  != null ? p.getValor() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendenteAtrasadoReceber = todasReceber.stream()
                .filter(p -> p.getStatus() == StatusConta.ABERTO && p.getDataVencimento().isBefore(hoje))
                .map(   p -> p.getValor()  != null ? p.getValor() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendentePagar = todasPagar.stream()
                .filter(p -> p.getStatus() == StatusConta.ABERTO)
                .map(p -> p.getValor() != null ? p.getValor() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendenteAtrasadoPagar = todasPagar.stream()
                .filter(p -> p.getStatus() == StatusConta.ABERTO && p.getDataVencimento().isBefore(hoje))
                .map(p -> p.getValor() != null ? p.getValor() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Recebido / pago no mes atual
        int mesAtual = hoje.getMonthValue();
        int anoAtual = hoje.getYear();

        BigDecimal recebidoMes = todasReceber.stream()
                .filter(p -> p.getStatus() == StatusConta.PAGO
                        && p.getDataPagamento() != null
                        && p.getDataPagamento().getMonthValue() == mesAtual
                        && p.getDataPagamento().getYear() == anoAtual)
                .map(p -> p.getValorPago() != null ? p.getValorPago() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pagoMes = todasPagar.stream()
                .filter(p -> p.getStatus() == StatusConta.PAGO
                        && p.getDataPagamento() != null
                        && p.getDataPagamento().getMonthValue() == mesAtual
                        && p.getDataPagamento().getYear() == anoAtual)
                .map(p -> p.getValorPago() != null ? p.getValorPago() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Saldo geral
        BigDecimal totalRecebido = todasReceber.stream()
                .filter(p -> p.getStatus() == StatusConta.PAGO)
                .map(p -> p.getValorPago() != null ? p.getValorPago() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPago = todasPagar.stream()
                .filter(p -> p.getStatus() == StatusConta.PAGO)
                .map(p -> p.getValorPago() != null ? p.getValorPago() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<LancamentoFinanceiro> lancamentos = lancamentoRepo.findByClienteId(clienteId);

        BigDecimal totalEntradas = lancamentos.stream()
                .filter(l -> l.getTipo() == TipoLancamento.ENTRADA)
                .map(l -> l.getValor() != null ? l.getValor() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSaidas = lancamentos.stream()
                .filter(l -> l.getTipo() == TipoLancamento.SAIDA)
                .map(l -> l.getValor() != null ? l.getValor() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal saldoGeral = totalRecebido.subtract(totalPago).add(totalEntradas).subtract(totalSaidas);

        // Fluxo mensal
        List<FluxoMensalDto> fluxo = calcularFluxoMensal(todasReceber, todasPagar, lancamentos, hoje);

        // Saldo por conta
        List<ContaFinanceira> contas = contaFinanceiraRepo.findForSelect(clienteId);
        List<SaldoContaDto> saldoPorConta = calcularSaldoPorConta(todasReceber, todasPagar, lancamentos, contas);

        return new FinanceiroDashboardDto(
                pendenteReceber,
                pendenteAtrasadoReceber,
                pendentePagar,
                pendenteAtrasadoPagar,
                recebidoMes,
                pagoMes,
                saldoGeral,
                fluxo,
                saldoPorConta
        );
    }

    private List<FluxoMensalDto> calcularFluxoMensal(
            List<ParcelaContaReceber> todasReceber,
            List<ParcelaContaPagar> todasPagar,
            List<LancamentoFinanceiro> lancamentos,
            LocalDate hoje
    ) {
        List<FluxoMensalDto> fluxo = new ArrayList<>();
        YearMonth mesAtual = YearMonth.from(hoje);

        for (int i = 11; i >= 0; i--) {
            YearMonth mes = mesAtual.minusMonths(i);
            int m = mes.getMonthValue();
            int a = mes.getYear();

            BigDecimal recebido = todasReceber.stream()
                    .filter(p -> p.getStatus() == StatusConta.PAGO
                            && p.getDataPagamento() != null
                            && p.getDataPagamento().getMonthValue() == m
                            && p.getDataPagamento().getYear() == a)
                    .map(p -> p.getValorPago() != null ? p.getValorPago() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal entradas = lancamentos.stream()
                    .filter(l -> l.getTipo() == TipoLancamento.ENTRADA
                            && l.getData() != null
                            && l.getData().getMonthValue() == m
                            && l.getData().getYear() == a)
                    .map(l -> l.getValor() != null ? l.getValor() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal pago = todasPagar.stream()
                    .filter(p -> p.getStatus() == StatusConta.PAGO
                            && p.getDataPagamento() != null
                            && p.getDataPagamento().getMonthValue() == m
                            && p.getDataPagamento().getYear() == a)
                    .map(p -> p.getValorPago() != null ? p.getValorPago() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal saidas = lancamentos.stream()
                    .filter(l -> l.getTipo() == TipoLancamento.SAIDA
                            && l.getData() != null
                            && l.getData().getMonthValue() == m
                            && l.getData().getYear() == a)
                    .map(l -> l.getValor() != null ? l.getValor() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            String nomeMes = MESES_PT[m - 1] + "/" + String.valueOf(a).substring(2);
            fluxo.add(new FluxoMensalDto(nomeMes, recebido.add(entradas), pago.add(saidas)));
        }

        return fluxo;
    }

    private List<SaldoContaDto> calcularSaldoPorConta(
            List<ParcelaContaReceber> todasReceber,
            List<ParcelaContaPagar> todasPagar,
            List<LancamentoFinanceiro> lancamentos,
            List<ContaFinanceira> contas
    ) {
        List<SaldoContaDto> resultado = new ArrayList<>();

        for (ContaFinanceira conta : contas) {
            Long contaId = conta.getId();

            BigDecimal receber = todasReceber.stream()
                    .filter(p -> p.getStatus() == StatusConta.PAGO
                            && p.getContaFinanceira() != null
                            && contaId.equals(p.getContaFinanceira().getId()))
                    .map(p -> p.getValorPago() != null ? p.getValorPago() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal pagar = todasPagar.stream()
                    .filter(p -> p.getStatus() == StatusConta.PAGO
                            && p.getContaFinanceira() != null
                            && contaId.equals(p.getContaFinanceira().getId()))
                    .map(p -> p.getValorPago() != null ? p.getValorPago() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal entradas = lancamentos.stream()
                    .filter(l -> l.getTipo() == TipoLancamento.ENTRADA
                            && l.getContaFinanceira() != null
                            && contaId.equals(l.getContaFinanceira().getId()))
                    .map(l -> l.getValor() != null ? l.getValor() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal saidas = lancamentos.stream()
                    .filter(l -> l.getTipo() == TipoLancamento.SAIDA
                            && l.getContaFinanceira() != null
                            && contaId.equals(l.getContaFinanceira().getId()))
                    .map(l -> l.getValor() != null ? l.getValor() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal saldo = receber.subtract(pagar).add(entradas).subtract(saidas);
            resultado.add(new SaldoContaDto(conta.getNome(), saldo));
        }

        // Parcelas sem conta financeira
        BigDecimal semContaReceber = todasReceber.stream()
                .filter(p -> p.getStatus() == StatusConta.PAGO && p.getContaFinanceira() == null)
                .map(p -> p.getValorPago() != null ? p.getValorPago() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal semContaPagar = todasPagar.stream()
                .filter(p -> p.getStatus() == StatusConta.PAGO && p.getContaFinanceira() == null)
                .map(p -> p.getValorPago() != null ? p.getValorPago() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal semContaSaldo = semContaReceber.subtract(semContaPagar);
        if (semContaSaldo.compareTo(BigDecimal.ZERO) != 0) {
            resultado.add(new SaldoContaDto("Sem conta", semContaSaldo));
        }

        return resultado;
    }
}
