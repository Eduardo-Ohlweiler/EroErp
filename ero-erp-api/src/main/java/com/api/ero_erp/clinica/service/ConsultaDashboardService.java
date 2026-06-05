package com.api.ero_erp.clinica.service;

import com.api.ero_erp.clinica.dtos.ConsultaDashboardDto;
import com.api.ero_erp.clinica.dtos.ConsultaDashboardDto.*;
import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.clinica.entity.ConsultaProduto;
import com.api.ero_erp.clinica.entity.ConsultaServico;
import com.api.ero_erp.clinica.mapper.ConsultaMapper;
import com.api.ero_erp.clinica.repository.ConsultaProdutoRepository;
import com.api.ero_erp.clinica.repository.ConsultaRepository;
import com.api.ero_erp.clinica.repository.ConsultaServicoRepository;
import com.api.ero_erp.config.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ConsultaDashboardService {

    private static final String[] DIAS_PT     = {"Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"};
    private static final LocalDateTime EPOCH  = LocalDateTime.of(1900, 1, 1, 0, 0);

    private final ConsultaRepository        consultaRepository;
    private final ConsultaServicoRepository servicoRepository;
    private final ConsultaProdutoRepository produtoRepository;
    private final SecurityUtils             securityUtils;

    public ConsultaDashboardService(
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
    public ConsultaDashboardDto getDashboard(int dias) {
        Long clienteId = securityUtils.getClienteIdLogado();

        LocalDateTime desde     = dias > 0 ? LocalDateTime.now().minusDays(dias) : EPOCH;
        LocalDateTime inicioMes = LocalDateTime.now()
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);

        List<Consulta>        consultas = consultaRepository.findConcluidasForDashboard(clienteId, desde);
        List<ConsultaServico> servicos  = servicoRepository.findForDashboard(clienteId, desde);
        List<ConsultaProduto> produtos  = produtoRepository.findForDashboard(clienteId, desde);

        // Indexa itens por consultaId
        Map<Long, List<ConsultaServico>> servicosPorConsulta =
                servicos.stream().collect(Collectors.groupingBy(cs -> cs.getConsulta().getId()));
        Map<Long, List<ConsultaProduto>> produtosPorConsulta =
                produtos.stream().collect(Collectors.groupingBy(cp -> cp.getConsulta().getId()));

        // Receita por consulta (inclui ajuste global)
        Map<Long, BigDecimal> receitaPorConsulta = new HashMap<>(consultas.size());
        for (Consulta c : consultas) {
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

        // ── KPIs ────────────────────────────────────────────────────────────────
        long totalConcluidas   = consultas.size();
        long concluidasEsteMes = consultas.stream()
                .filter(c -> !c.getInicio().isBefore(inicioMes)).count();

        BigDecimal receitaTotal = receitaPorConsulta.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal receitaMes = consultas.stream()
                .filter(c -> !c.getInicio().isBefore(inicioMes))
                .map(c -> receitaPorConsulta.getOrDefault(c.getId(), BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal ticketMedio = totalConcluidas > 0
                ? receitaTotal.divide(BigDecimal.valueOf(totalConcluidas), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // ── Serviços mais vendidos ───────────────────────────────────────────────
        Map<Long, List<ConsultaServico>> servicosPorProduto = servicos.stream()
                .collect(Collectors.groupingBy(cs -> cs.getProduto().getId()));

        List<ServicoRankingDto> servicosMaisVendidos = servicosPorProduto.values().stream()
                .map(list -> {
                    String     nome        = list.get(0).getProduto().getNome();
                    long       atend       = list.size();
                    BigDecimal qtdTotal    = list.stream().map(ConsultaServico::getQuantidade)
                                               .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal receita     = list.stream()
                                               .map(cs -> ConsultaMapper.calcTotal(
                                                       cs.getPrecoUnitario(), cs.getQuantidade(),
                                                       cs.getTipoAjuste(), cs.getTipoCalculo(), cs.getValorAjuste()))
                                               .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal precoMedio  = qtdTotal.compareTo(BigDecimal.ZERO) > 0
                                               ? receita.divide(qtdTotal, 2, RoundingMode.HALF_UP)
                                               : BigDecimal.ZERO;
                    return new ServicoRankingDto(nome, atend, qtdTotal, precoMedio, receita);
                })
                .sorted(Comparator.comparingLong(ServicoRankingDto::atendimentos).reversed())
                .limit(10)
                .toList();

        // ── Por dia da semana ────────────────────────────────────────────────────
        // DayOfWeek: MON=1 … SUN=7  →  domingo = índice 0
        Map<Integer, List<Consulta>> porDow = consultas.stream()
                .collect(Collectors.groupingBy(c -> c.getInicio().getDayOfWeek().getValue() % 7));

        List<DiaSemanaDto> porDiaSemana = new ArrayList<>(7);
        for (int i = 0; i < 7; i++) {
            List<Consulta> lista   = porDow.getOrDefault(i, List.of());
            BigDecimal     receita = lista.stream()
                    .map(c -> receitaPorConsulta.getOrDefault(c.getId(), BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            porDiaSemana.add(new DiaSemanaDto(DIAS_PT[i], lista.size(), receita));
        }

        // ── Clientes mais fiéis ──────────────────────────────────────────────────
        Map<Long, List<Consulta>> porPessoa = consultas.stream()
                .collect(Collectors.groupingBy(c -> c.getPessoa().getId()));

        List<ClienteRankingDto> clientesMaisVieis = porPessoa.values().stream()
                .map(list -> {
                    String     nome    = list.get(0).getPessoa().getNome();
                    long       qtd     = list.size();
                    BigDecimal receita = list.stream()
                            .map(c -> receitaPorConsulta.getOrDefault(c.getId(), BigDecimal.ZERO))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new ClienteRankingDto(nome, qtd, receita);
                })
                .sorted(Comparator.comparingLong(ClienteRankingDto::consultas).reversed())
                .limit(10)
                .toList();

        // ── Receita últimos 30 dias ──────────────────────────────────────────────
        LocalDate hoje         = LocalDate.now();
        LocalDate ha30Dias     = hoje.minusDays(29);
        DateTimeFormatter dtf  = DateTimeFormatter.ofPattern("dd/MM");

        Map<LocalDate, List<Consulta>> por30Dias = consultas.stream()
                .filter(c -> !c.getInicio().toLocalDate().isBefore(ha30Dias))
                .collect(Collectors.groupingBy(c -> c.getInicio().toLocalDate()));

        List<DiaReceitaDto> receitaUltimos30Dias = new ArrayList<>(30);
        for (int i = 29; i >= 0; i--) {
            LocalDate      dia    = hoje.minusDays(i);
            List<Consulta> lista  = por30Dias.getOrDefault(dia, List.of());
            BigDecimal     rec    = lista.stream()
                    .map(c -> receitaPorConsulta.getOrDefault(c.getId(), BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            receitaUltimos30Dias.add(new DiaReceitaDto(dia.format(dtf), lista.size(), rec));
        }

        return new ConsultaDashboardDto(
                totalConcluidas, concluidasEsteMes,
                receitaTotal, receitaMes, ticketMedio,
                servicosMaisVendidos, porDiaSemana,
                clientesMaisVieis, receitaUltimos30Dias
        );
    }
}
