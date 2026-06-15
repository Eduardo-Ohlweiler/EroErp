package com.api.ero_erp.financeiro.dashboard.service;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.financeiro.contapagar.entity.ContaPagar;
import com.api.ero_erp.financeiro.contapagar.entity.ParcelaContaPagar;
import com.api.ero_erp.financeiro.contapagar.repository.ContaPagarRepository;
import com.api.ero_erp.financeiro.contapagar.repository.ParcelaContaPagarRepository;
import com.api.ero_erp.financeiro.contareceber.entity.ContaReceber;
import com.api.ero_erp.financeiro.contareceber.entity.ParcelaContaReceber;
import com.api.ero_erp.financeiro.contareceber.repository.ContaReceberRepository;
import com.api.ero_erp.financeiro.contareceber.repository.ParcelaContaReceberRepository;
import com.api.ero_erp.financeiro.dashboard.dtos.FinanceiroFluxoDashboardDto;
import com.api.ero_erp.financeiro.dashboard.dtos.FinanceiroFluxoDashboardDto.EmitenteFluxoDto;
import com.api.ero_erp.financeiro.dashboard.dtos.FinanceiroFluxoDashboardDto.FluxoPeriodoDto;
import com.api.ero_erp.financeiro.dashboard.dtos.FinanceiroFluxoDashboardDto.PessoaFluxoDto;
import com.api.ero_erp.financeiro.enums.TipoLancamento;
import com.api.ero_erp.financeiro.lancamento.entity.LancamentoFinanceiro;
import com.api.ero_erp.financeiro.lancamento.repository.LancamentoFinanceiroRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class FinanceiroFluxoDashboardService {

    private static final LocalDate         EPOCH    = LocalDate.of(1900, 1, 1);
    private static final DateTimeFormatter MES_FMT  = DateTimeFormatter.ofPattern("MM/yy");
    private static final String REGIME_COMPETENCIA  = "COMPETENCIA";
    private static final String REGIME_CAIXA        = "CAIXA";

    private final ParcelaContaReceberRepository parcelaReceberRepo;
    private final ParcelaContaPagarRepository   parcelaPagarRepo;
    private final ContaReceberRepository        contaReceberRepo;
    private final ContaPagarRepository          contaPagarRepo;
    private final LancamentoFinanceiroRepository lancamentoRepo;
    private final SecurityUtils                 securityUtils;

    public FinanceiroFluxoDashboardService(
            ParcelaContaReceberRepository   parcelaReceberRepo,
            ParcelaContaPagarRepository     parcelaPagarRepo,
            ContaReceberRepository          contaReceberRepo,
            ContaPagarRepository            contaPagarRepo,
            LancamentoFinanceiroRepository  lancamentoRepo,
            SecurityUtils                   securityUtils
    ) {
        this.parcelaReceberRepo = parcelaReceberRepo;
        this.parcelaPagarRepo   = parcelaPagarRepo;
        this.contaReceberRepo   = contaReceberRepo;
        this.contaPagarRepo     = contaPagarRepo;
        this.lancamentoRepo     = lancamentoRepo;
        this.securityUtils      = securityUtils;
    }

    /**
     * Movimento normalizado de fluxo de caixa.
     * credito = true → entra no total/ranking de creditos; false → debitos.
     * pessoaId/pessoaNome e emitente* podem ser null (ex.: lancamentos manuais nao tem pessoa/emitente).
     */
    private record Movimento(
            boolean credito,
            BigDecimal valor,
            LocalDate data,
            Long pessoaId,
            String pessoaNome,
            Long emitenteId,
            String emitenteNome,
            String emitenteCor
    ) {}

    @Transactional(readOnly = true)
    public FinanceiroFluxoDashboardDto getFluxo(int dias, Long emitenteId, Long contaId, String regime) {
        Long clienteId = securityUtils.getClienteIdLogado();

        LocalDate desde = dias > 0 ? LocalDate.now().minusDays(dias) : EPOCH;
        LocalDate ate   = LocalDate.now();

        String regimeNorm = (regime != null && REGIME_COMPETENCIA.equalsIgnoreCase(regime.trim()))
                ? REGIME_COMPETENCIA
                : REGIME_CAIXA;

        List<Movimento> creditos = new ArrayList<>();
        List<Movimento> debitos  = new ArrayList<>();

        if (REGIME_COMPETENCIA.equals(regimeNorm)) {
            // COMPETENCIA: usa as contas pela data de emissao (valorTotal). Nao inclui lancamentos manuais.
            // O filtro contaId e ignorado aqui: contas nao possuem uma conta financeira unica
            // (a conta financeira existe a nivel de parcela, nao da conta).
            for (ContaReceber c : contaReceberRepo.findEmitidasNoPeriodo(clienteId, desde, ate, emitenteId)) {
                creditos.add(movimentoDeConta(true, c.getValorTotal(), c.getData(), c.getPessoa(), c.getEmitente()));
            }
            for (ContaPagar c : contaPagarRepo.findEmitidasNoPeriodo(clienteId, desde, ate, emitenteId)) {
                debitos.add(movimentoDeConta(false, c.getValorTotal(), c.getData(),
                        c.getPessoa() != null ? c.getPessoa().getId()   : null,
                        c.getPessoa() != null ? c.getPessoa().getNome() : null,
                        c.getEmitente()));
            }
        } else {
            // CAIXA: usa parcelas efetivamente liquidadas (valorPago, por dataPagamento)
            // + lancamentos manuais (valor, por data). O filtro contaId aplica a ambos.
            for (ParcelaContaReceber p : parcelaReceberRepo.findRecebidasNoPeriodo(clienteId, desde, ate, emitenteId, contaId)) {
                ContaReceber c = p.getContaReceber();
                creditos.add(new Movimento(
                        true,
                        valorOuZero(p.getValorPago()),
                        p.getDataPagamento(),
                        c.getPessoa() != null ? c.getPessoa().getId()   : null,
                        c.getPessoa() != null ? c.getPessoa().getNome() : null,
                        c.getEmitente() != null ? c.getEmitente().getId() : null,
                        c.getEmitente() != null && c.getEmitente().getPessoa() != null
                                ? c.getEmitente().getPessoa().getNome() : null,
                        c.getEmitente() != null ? c.getEmitente().getCor() : null
                ));
            }
            for (ParcelaContaPagar p : parcelaPagarRepo.findPagasNoPeriodo(clienteId, desde, ate, emitenteId, contaId)) {
                ContaPagar c = p.getContaPagar();
                debitos.add(new Movimento(
                        false,
                        valorOuZero(p.getValorPago()),
                        p.getDataPagamento(),
                        c.getPessoa() != null ? c.getPessoa().getId()   : null,
                        c.getPessoa() != null ? c.getPessoa().getNome() : null,
                        c.getEmitente() != null ? c.getEmitente().getId() : null,
                        c.getEmitente() != null && c.getEmitente().getPessoa() != null
                                ? c.getEmitente().getPessoa().getNome() : null,
                        c.getEmitente() != null ? c.getEmitente().getCor() : null
                ));
            }
            // Lancamentos manuais: ENTRADA → credito, SAIDA → debito. Sem pessoa/emitente
            // (entram nos totais e no porPeriodo, mas sao excluidos dos rankings por pessoa/emitente).
            for (LancamentoFinanceiro l : lancamentoRepo.findNoPeriodo(clienteId, desde, ate, contaId)) {
                Movimento m = new Movimento(
                        l.getTipo() == TipoLancamento.ENTRADA,
                        valorOuZero(l.getValor()),
                        l.getData(),
                        null, null, null, null, null
                );
                if (m.credito()) creditos.add(m); else debitos.add(m);
            }
        }

        BigDecimal totalCreditos = somar(creditos);
        BigDecimal totalDebitos  = somar(debitos);
        BigDecimal saldoPeriodo  = totalCreditos.subtract(totalDebitos).setScale(2, RoundingMode.HALF_UP);

        List<FluxoPeriodoDto>  porPeriodo  = montarPorPeriodo(creditos, debitos, desde, YearMonth.now());
        List<PessoaFluxoDto>   porPessoa   = montarPorPessoa(creditos, debitos);
        List<EmitenteFluxoDto> porEmitente = montarPorEmitente(creditos, debitos);

        return new FinanceiroFluxoDashboardDto(
                regimeNorm,
                totalCreditos,
                totalDebitos,
                saldoPeriodo,
                creditos.size(),
                debitos.size(),
                porPeriodo,
                porPessoa,
                porEmitente
        );
    }

    private Movimento movimentoDeConta(boolean credito, BigDecimal valor, LocalDate data,
                                       com.api.ero_erp.pessoa.entity.Pessoa pessoa,
                                       com.api.ero_erp.emitente.entity.Emitente emitente) {
        return movimentoDeConta(credito, valor, data,
                pessoa != null ? pessoa.getId()   : null,
                pessoa != null ? pessoa.getNome() : null,
                emitente);
    }

    private Movimento movimentoDeConta(boolean credito, BigDecimal valor, LocalDate data,
                                       Long pessoaId, String pessoaNome,
                                       com.api.ero_erp.emitente.entity.Emitente emitente) {
        return new Movimento(
                credito,
                valorOuZero(valor),
                data,
                pessoaId,
                pessoaNome,
                emitente != null ? emitente.getId() : null,
                emitente != null && emitente.getPessoa() != null ? emitente.getPessoa().getNome() : null,
                emitente != null ? emitente.getCor() : null
        );
    }

    /** Buckets mensais continuos (preenchendo meses vazios), janela maxima de 12 meses ate o mes atual. */
    private List<FluxoPeriodoDto> montarPorPeriodo(List<Movimento> creditos, List<Movimento> debitos,
                                                   LocalDate desde, YearMonth mesAtual) {
        Map<YearMonth, BigDecimal> credPorMes = somarPorMes(creditos);
        Map<YearMonth, BigDecimal> debPorMes  = somarPorMes(debitos);

        YearMonth desdeMes = YearMonth.from(desde);
        YearMonth limite   = mesAtual.minusMonths(11);
        YearMonth inicio   = desdeMes.isAfter(limite) ? desdeMes : limite;

        List<FluxoPeriodoDto> periodos = new ArrayList<>();
        for (YearMonth ym = inicio; !ym.isAfter(mesAtual); ym = ym.plusMonths(1)) {
            BigDecimal cred = credPorMes.getOrDefault(ym, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal deb  = debPorMes.getOrDefault(ym, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            periodos.add(new FluxoPeriodoDto(
                    ym.atDay(1).format(MES_FMT),
                    cred,
                    deb,
                    cred.subtract(deb).setScale(2, RoundingMode.HALF_UP)));
        }
        return periodos;
    }

    private Map<YearMonth, BigDecimal> somarPorMes(List<Movimento> movimentos) {
        Map<YearMonth, BigDecimal> mapa = new LinkedHashMap<>();
        for (Movimento m : movimentos) {
            if (m.data() == null) continue;
            YearMonth ym = YearMonth.from(m.data());
            mapa.merge(ym, m.valor(), BigDecimal::add);
        }
        return mapa;
    }

    /** Ranking por pessoa (somente movimentos com pessoa). Top 10 por (creditos + debitos) desc. */
    private List<PessoaFluxoDto> montarPorPessoa(List<Movimento> creditos, List<Movimento> debitos) {
        record Acc(String nome, BigDecimal[] cred, BigDecimal[] deb) {}
        Map<Long, Acc> mapa = new LinkedHashMap<>();

        for (Movimento m : creditos) {
            if (m.pessoaId() == null) continue;
            Acc acc = mapa.computeIfAbsent(m.pessoaId(),
                    k -> new Acc(m.pessoaNome(), new BigDecimal[]{BigDecimal.ZERO}, new BigDecimal[]{BigDecimal.ZERO}));
            acc.cred()[0] = acc.cred()[0].add(m.valor());
        }
        for (Movimento m : debitos) {
            if (m.pessoaId() == null) continue;
            Acc acc = mapa.computeIfAbsent(m.pessoaId(),
                    k -> new Acc(m.pessoaNome(), new BigDecimal[]{BigDecimal.ZERO}, new BigDecimal[]{BigDecimal.ZERO}));
            acc.deb()[0] = acc.deb()[0].add(m.valor());
        }

        return mapa.entrySet().stream()
                .map(e -> new PessoaFluxoDto(
                        e.getKey(),
                        e.getValue().nome(),
                        e.getValue().cred()[0].setScale(2, RoundingMode.HALF_UP),
                        e.getValue().deb()[0].setScale(2, RoundingMode.HALF_UP)))
                .sorted(Comparator.comparing(
                        (PessoaFluxoDto p) -> p.creditos().add(p.debitos())).reversed())
                .limit(10)
                .toList();
    }

    /** Ranking por emitente (somente movimentos com emitente; nulos ignorados). Top 10 por (creditos + debitos) desc. */
    private List<EmitenteFluxoDto> montarPorEmitente(List<Movimento> creditos, List<Movimento> debitos) {
        record Acc(String nome, String cor, BigDecimal[] cred, BigDecimal[] deb) {}
        Map<Long, Acc> mapa = new LinkedHashMap<>();

        for (Movimento m : creditos) {
            if (m.emitenteId() == null) continue;
            Acc acc = mapa.computeIfAbsent(m.emitenteId(),
                    k -> new Acc(m.emitenteNome(), m.emitenteCor(), new BigDecimal[]{BigDecimal.ZERO}, new BigDecimal[]{BigDecimal.ZERO}));
            acc.cred()[0] = acc.cred()[0].add(m.valor());
        }
        for (Movimento m : debitos) {
            if (m.emitenteId() == null) continue;
            Acc acc = mapa.computeIfAbsent(m.emitenteId(),
                    k -> new Acc(m.emitenteNome(), m.emitenteCor(), new BigDecimal[]{BigDecimal.ZERO}, new BigDecimal[]{BigDecimal.ZERO}));
            acc.deb()[0] = acc.deb()[0].add(m.valor());
        }

        return mapa.entrySet().stream()
                .map(e -> new EmitenteFluxoDto(
                        e.getKey(),
                        e.getValue().nome(),
                        e.getValue().cor(),
                        e.getValue().cred()[0].setScale(2, RoundingMode.HALF_UP),
                        e.getValue().deb()[0].setScale(2, RoundingMode.HALF_UP)))
                .sorted(Comparator.comparing(
                        (EmitenteFluxoDto em) -> em.creditos().add(em.debitos())).reversed())
                .limit(10)
                .toList();
    }

    private BigDecimal somar(List<Movimento> movimentos) {
        return movimentos.stream()
                .map(Movimento::valor)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal valorOuZero(BigDecimal valor) {
        return valor != null ? valor : BigDecimal.ZERO;
    }
}
