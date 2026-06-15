package com.api.ero_erp.clinica.service;

import com.api.ero_erp.clinica.dtos.ConsultaDashboardAnaliticoDto;
import com.api.ero_erp.clinica.dtos.ConsultaDashboardAnaliticoDto.*;
import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.clinica.entity.ConsultaProduto;
import com.api.ero_erp.clinica.entity.ConsultaServico;
import com.api.ero_erp.clinica.enums.StatusConsulta;
import com.api.ero_erp.clinica.mapper.ConsultaMapper;
import com.api.ero_erp.clinica.repository.ConsultaProdutoRepository;
import com.api.ero_erp.clinica.repository.ConsultaRepository;
import com.api.ero_erp.clinica.repository.ConsultaServicoRepository;
import com.api.ero_erp.config.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ConsultaDashboardAnaliticoService {

    private static final String[] DIAS_PT     = {"Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"};
    private static final LocalDateTime EPOCH  = LocalDateTime.of(1900, 1, 1, 0, 0);
    private static final DateTimeFormatter MES_FMT = DateTimeFormatter.ofPattern("MM/yy");

    private final ConsultaRepository        consultaRepository;
    private final ConsultaServicoRepository servicoRepository;
    private final ConsultaProdutoRepository produtoRepository;
    private final SecurityUtils             securityUtils;

    public ConsultaDashboardAnaliticoService(
            ConsultaRepository        consultaRepository,
            ConsultaServicoRepository servicoRepository,
            ConsultaProdutoRepository produtoRepository,
            SecurityUtils             securityUtils
    ) {
        this.consultaRepository = consultaRepository;
        this.servicoRepository  = servicoRepository;
        this.produtoRepository  = produtoRepository;
        this.securityUtils      = securityUtils;
    }

    @Transactional(readOnly = true)
    public ConsultaDashboardAnaliticoDto getDashboard(
            int dias, Long emitenteId, StatusConsulta status, Long pessoaId
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();

        LocalDateTime desde     = dias > 0 ? LocalDateTime.now().minusDays(dias) : EPOCH;
        LocalDateTime ate       = LocalDateTime.now();
        LocalDateTime inicioMes = LocalDateTime.now()
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);

        List<Consulta> consultas =
                consultaRepository.findForDashboardAnalitico(clienteId, desde, ate, emitenteId, status, pessoaId);
        List<ConsultaServico> servicos =
                servicoRepository.findForDashboardAnalitico(clienteId, desde, ate, emitenteId, pessoaId);
        List<ConsultaProduto> produtos =
                produtoRepository.findForDashboardAnalitico(clienteId, desde, ate, emitenteId, pessoaId);

        // Apenas consultas CONCLUIDA possuem receita (serviços/produtos já vêm só de concluídas)
        List<Consulta> concluidas = consultas.stream()
                .filter(c -> c.getStatus() == StatusConsulta.CONCLUIDA)
                .toList();

        // Indexa itens por consultaId
        Map<Long, List<ConsultaServico>> servicosPorConsulta =
                servicos.stream().collect(Collectors.groupingBy(cs -> cs.getConsulta().getId()));
        Map<Long, List<ConsultaProduto>> produtosPorConsulta =
                produtos.stream().collect(Collectors.groupingBy(cp -> cp.getConsulta().getId()));

        // Receita por consulta (inclui ajuste global) — replica ConsultaDashboardService
        Map<Long, BigDecimal> receitaPorConsulta = new HashMap<>(concluidas.size());
        for (Consulta c : concluidas) {
            BigDecimal sub = BigDecimal.ZERO;

            for (ConsultaServico cs : servicosPorConsulta.getOrDefault(c.getId(), List.of())) {
                sub = sub.add(ConsultaMapper.calcTotal(
                        cs.getPrecoUnitario(), cs.getQuantidade(),
                        cs.getTipoAjuste(), cs.getTipoCalculo(), cs.getValorAjuste()));
            }
            for (ConsultaProduto cp : produtosPorConsulta.getOrDefault(c.getId(), List.of())) {
                sub = sub.add(ConsultaMapper.calcTotal(
                        cp.getPrecoUnitario(), cp.getQuantidade(),
                        cp.getTipoAjuste(), cp.getTipoCalculo(), cp.getValorAjuste()));
            }

            // Ajuste geral da consulta
            if (c.getTipoAjusteGeral() != null && c.getValorAjusteGeral() != null) {
                BigDecimal aj = "PERCENTUAL".equalsIgnoreCase(c.getTipoCalculoGeral())
                        ? sub.multiply(c.getValorAjusteGeral())
                             .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                        : c.getValorAjusteGeral().setScale(2, RoundingMode.HALF_UP);
                sub = "DESCONTO".equalsIgnoreCase(c.getTipoAjusteGeral())
                        ? sub.subtract(aj) : sub.add(aj);
            }

            receitaPorConsulta.put(c.getId(), sub.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
        }

        // ── KPIs de contagem (todas as consultas da base, respeitando filtros) ─────
        long totalConsultas = consultas.size();

        Map<StatusConsulta, List<Consulta>> porStatusMap = consultas.stream()
                .collect(Collectors.groupingBy(Consulta::getStatus));

        long totalConcluidas = porStatusMap.getOrDefault(StatusConsulta.CONCLUIDA, List.of()).size();
        long totalCanceladas = porStatusMap.getOrDefault(StatusConsulta.CANCELADA, List.of()).size();
        long totalReconsultas = consultas.stream()
                .filter(c -> c.getConsultaPai() != null).count();

        BigDecimal taxaReconsulta = totalConsultas > 0
                ? BigDecimal.valueOf(totalReconsultas * 100)
                        .divide(BigDecimal.valueOf(totalConsultas), 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);

        // ── Faturamento (só concluídas) ───────────────────────────────────────────
        BigDecimal receitaTotal = receitaPorConsulta.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal receitaMes = concluidas.stream()
                .filter(c -> !c.getInicio().isBefore(inicioMes))
                .map(c -> receitaPorConsulta.getOrDefault(c.getId(), BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal ticketMedio = totalConcluidas > 0
                ? receitaTotal.divide(BigDecimal.valueOf(totalConcluidas), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        // ── porStatus (todas as consultas) ────────────────────────────────────────
        List<StatusDistribuicaoDto> porStatus = porStatusMap.entrySet().stream()
                .map(e -> new StatusDistribuicaoDto(e.getKey().name(), e.getValue().size()))
                .sorted(Comparator.comparingLong(StatusDistribuicaoDto::quantidade).reversed())
                .toList();

        // ── porPeriodo (buckets mensais contínuos, só concluídas) ─────────────────
        List<PeriodoDto> porPeriodo = montarPorPeriodo(concluidas, receitaPorConsulta, desde);

        // ── Serviços mais vendidos (só concluídas, via tabela de serviços) ────────
        Map<Long, List<ConsultaServico>> servicosPorProduto = servicos.stream()
                .collect(Collectors.groupingBy(cs -> cs.getProduto().getId()));

        List<ServicoRankingDto> servicosMaisVendidos = servicosPorProduto.values().stream()
                .map(list -> {
                    String     nome       = list.get(0).getProduto().getNome();
                    long       atend      = list.size();
                    BigDecimal qtdTotal   = list.stream().map(ConsultaServico::getQuantidade)
                                              .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal receita    = list.stream()
                                              .map(cs -> ConsultaMapper.calcTotal(
                                                      cs.getPrecoUnitario(), cs.getQuantidade(),
                                                      cs.getTipoAjuste(), cs.getTipoCalculo(), cs.getValorAjuste()))
                                              .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal precoMedio = qtdTotal.compareTo(BigDecimal.ZERO) > 0
                                              ? receita.divide(qtdTotal, 2, RoundingMode.HALF_UP)
                                              : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
                    return new ServicoRankingDto(nome, atend, qtdTotal,
                            precoMedio, receita.setScale(2, RoundingMode.HALF_UP));
                })
                .sorted(Comparator.comparingLong(ServicoRankingDto::atendimentos).reversed())
                .limit(10)
                .toList();

        // ── porEmitente (só concluídas) ───────────────────────────────────────────
        List<EmitenteRankingDto> porEmitente = concluidas.stream()
                .collect(Collectors.groupingBy(c -> c.getEmitente().getId()))
                .values().stream()
                .map(list -> {
                    Consulta ref = list.get(0);
                    BigDecimal receita = list.stream()
                            .map(c -> receitaPorConsulta.getOrDefault(c.getId(), BigDecimal.ZERO))
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .setScale(2, RoundingMode.HALF_UP);
                    return new EmitenteRankingDto(
                            ref.getEmitente().getId(),
                            ref.getEmitente().getPessoa().getNome(),
                            ref.getEmitente().getCor(),
                            list.size(),
                            receita);
                })
                .sorted(Comparator.comparing(EmitenteRankingDto::receita).reversed())
                .limit(10)
                .toList();

        // ── Clientes mais fiéis (só concluídas) ───────────────────────────────────
        List<ClienteRankingDto> clientesMaisFieis = concluidas.stream()
                .collect(Collectors.groupingBy(c -> c.getPessoa().getId()))
                .values().stream()
                .map(list -> {
                    Consulta ref = list.get(0);
                    BigDecimal receita = list.stream()
                            .map(c -> receitaPorConsulta.getOrDefault(c.getId(), BigDecimal.ZERO))
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .setScale(2, RoundingMode.HALF_UP);
                    return new ClienteRankingDto(
                            ref.getPessoa().getId(),
                            ref.getPessoa().getNome(),
                            list.size(),
                            receita);
                })
                .sorted(Comparator.comparingLong(ClienteRankingDto::consultas).reversed())
                .limit(10)
                .toList();

        // ── Por dia da semana (só concluídas) ─────────────────────────────────────
        // DayOfWeek: MON=1 … SUN=7  →  domingo = índice 0
        Map<Integer, List<Consulta>> porDow = concluidas.stream()
                .collect(Collectors.groupingBy(c -> c.getInicio().getDayOfWeek().getValue() % 7));

        List<DiaSemanaDto> porDiaSemana = new ArrayList<>(7);
        for (int i = 0; i < 7; i++) {
            List<Consulta> lista   = porDow.getOrDefault(i, List.of());
            BigDecimal     receita = lista.stream()
                    .map(c -> receitaPorConsulta.getOrDefault(c.getId(), BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            porDiaSemana.add(new DiaSemanaDto(DIAS_PT[i], lista.size(), receita));
        }

        return new ConsultaDashboardAnaliticoDto(
                totalConsultas, totalConcluidas, totalCanceladas,
                totalReconsultas, taxaReconsulta,
                receitaTotal, receitaMes, ticketMedio,
                porStatus, porPeriodo, servicosMaisVendidos,
                porEmitente, clientesMaisFieis, porDiaSemana
        );
    }

    /** Agrupa concluídas por YearMonth e gera buckets contínuos (preenchendo meses vazios), limitado a 12 meses. */
    private List<PeriodoDto> montarPorPeriodo(
            List<Consulta> concluidas, Map<Long, BigDecimal> receitaPorConsulta, LocalDateTime desde
    ) {
        YearMonth mesAtual = YearMonth.now();

        Map<YearMonth, List<Consulta>> porMes = concluidas.stream()
                .collect(Collectors.groupingBy(c -> YearMonth.from(c.getInicio())));

        // Início = max(desde, hoje-12meses); janela máxima de 12 meses até o mês atual.
        YearMonth desdeMes = YearMonth.from(desde);
        YearMonth limite   = mesAtual.minusMonths(11);
        YearMonth inicio   = desdeMes.isAfter(limite) ? desdeMes : limite;

        List<PeriodoDto> periodos = new ArrayList<>();
        for (YearMonth ym = inicio; !ym.isAfter(mesAtual); ym = ym.plusMonths(1)) {
            List<Consulta> lista   = porMes.getOrDefault(ym, List.of());
            BigDecimal     receita = lista.stream()
                    .map(c -> receitaPorConsulta.getOrDefault(c.getId(), BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            periodos.add(new PeriodoDto(ym.atDay(1).format(MES_FMT), lista.size(), receita));
        }
        return periodos;
    }
}
