package com.api.ero_erp.pedido.service;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.pedido.dtos.PedidoDashboardDto;
import com.api.ero_erp.pedido.dtos.PedidoDashboardDto.*;
import com.api.ero_erp.pedido.entity.Pedido;
import com.api.ero_erp.pedido.entity.PedidoProduto;
import com.api.ero_erp.pedido.enums.StatusPedido;
import com.api.ero_erp.pedido.mapper.PedidoMapper;
import com.api.ero_erp.pedido.repository.PedidoProdutoRepository;
import com.api.ero_erp.pedido.repository.PedidoRepository;
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
public class PedidoDashboardService {

    private static final String[] DIAS_PT    = {"Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"};
    private static final LocalDateTime EPOCH  = LocalDateTime.of(1900, 1, 1, 0, 0);
    private static final DateTimeFormatter MES_FMT = DateTimeFormatter.ofPattern("MM/yy");

    private final PedidoRepository        pedidoRepository;
    private final PedidoProdutoRepository produtoRepository;
    private final SecurityUtils           securityUtils;

    public PedidoDashboardService(
            PedidoRepository        pedidoRepository,
            PedidoProdutoRepository produtoRepository,
            SecurityUtils           securityUtils
    ) {
        this.pedidoRepository  = pedidoRepository;
        this.produtoRepository = produtoRepository;
        this.securityUtils     = securityUtils;
    }

    @Transactional(readOnly = true)
    public PedidoDashboardDto getDashboard(
            LocalDateTime inicio, LocalDateTime fim,
            Long emitenteId, Long tipoPedidoId, StatusPedido status, Long pessoaId
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();

        LocalDateTime desde     = inicio != null ? inicio : EPOCH;
        LocalDateTime ate       = fim    != null ? fim    : LocalDateTime.now();
        LocalDateTime inicioMes = LocalDateTime.now()
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);

        List<Pedido> pedidos =
                pedidoRepository.findForDashboard(clienteId, desde, ate, emitenteId, tipoPedidoId, status, pessoaId);
        List<PedidoProduto> produtos =
                produtoRepository.findForDashboard(clienteId, desde, ate, emitenteId, tipoPedidoId, status, pessoaId);

        // Apenas pedidos CONCLUIDO possuem valor (produtos já vêm só de concluídos)
        List<Pedido> concluidos = pedidos.stream()
                .filter(p -> p.getStatus() == StatusPedido.CONCLUIDO)
                .toList();

        Map<Long, List<PedidoProduto>> produtosPorPedido =
                produtos.stream().collect(Collectors.groupingBy(pp -> pp.getPedido().getId()));

        // Valor por pedido (inclui ajuste global)
        Map<Long, BigDecimal> valorPorPedido = new HashMap<>(concluidos.size());
        for (Pedido p : concluidos) {
            BigDecimal sub = BigDecimal.ZERO;
            for (PedidoProduto pp : produtosPorPedido.getOrDefault(p.getId(), List.of())) {
                sub = sub.add(PedidoMapper.calcTotal(
                        pp.getPrecoUnitario(), pp.getQuantidade(),
                        pp.getTipoAjuste(), pp.getTipoCalculo(), pp.getValorAjuste()));
            }
            if (p.getTipoAjusteGeral() != null && p.getValorAjusteGeral() != null) {
                BigDecimal aj = "PERCENTUAL".equalsIgnoreCase(p.getTipoCalculoGeral())
                        ? sub.multiply(p.getValorAjusteGeral())
                             .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                        : p.getValorAjusteGeral().setScale(2, RoundingMode.HALF_UP);
                sub = "DESCONTO".equalsIgnoreCase(p.getTipoAjusteGeral())
                        ? sub.subtract(aj) : sub.add(aj);
            }
            valorPorPedido.put(p.getId(), sub.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
        }

        // ── KPIs de contagem (todos os pedidos da base, respeitando filtros) ──────
        long totalPedidos = pedidos.size();

        Map<StatusPedido, List<Pedido>> porStatusMap = pedidos.stream()
                .collect(Collectors.groupingBy(Pedido::getStatus));

        long totalAbertos    = porStatusMap.getOrDefault(StatusPedido.ABERTO,    List.of()).size();
        long totalConcluidos = porStatusMap.getOrDefault(StatusPedido.CONCLUIDO, List.of()).size();
        long totalCancelados = porStatusMap.getOrDefault(StatusPedido.CANCELADO, List.of()).size();

        // ── Valor (só concluídos) ─────────────────────────────────────────────────
        BigDecimal valorTotal = valorPorPedido.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal valorMes = concluidos.stream()
                .filter(p -> !p.getDataPedido().isBefore(inicioMes))
                .map(p -> valorPorPedido.getOrDefault(p.getId(), BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal ticketMedio = totalConcluidos > 0
                ? valorTotal.divide(BigDecimal.valueOf(totalConcluidos), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        // ── porStatus (todos os pedidos) ──────────────────────────────────────────
        List<StatusDistribuicaoDto> porStatus = porStatusMap.entrySet().stream()
                .map(e -> new StatusDistribuicaoDto(e.getKey().name(), e.getValue().size()))
                .sorted(Comparator.comparingLong(StatusDistribuicaoDto::quantidade).reversed())
                .toList();

        // ── porPeriodo (buckets mensais contínuos, só concluídos) ─────────────────
        List<PeriodoDto> porPeriodo = montarPorPeriodo(concluidos, valorPorPedido, desde, ate);

        // ── porTipoPedido (só concluídos) ─────────────────────────────────────────
        List<TipoPedidoRankingDto> porTipoPedido = concluidos.stream()
                .collect(Collectors.groupingBy(p -> p.getTipoPedido().getId()))
                .values().stream()
                .map(list -> {
                    Pedido ref = list.get(0);
                    BigDecimal valor = list.stream()
                            .map(p -> valorPorPedido.getOrDefault(p.getId(), BigDecimal.ZERO))
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .setScale(2, RoundingMode.HALF_UP);
                    return new TipoPedidoRankingDto(ref.getTipoPedido().getNome(), list.size(), valor);
                })
                .sorted(Comparator.comparing(TipoPedidoRankingDto::valor).reversed())
                .toList();

        // ── Produtos mais vendidos (só concluídos) ────────────────────────────────
        List<ProdutoRankingDto> produtosMaisVendidos = produtos.stream()
                .collect(Collectors.groupingBy(pp -> pp.getProduto().getId()))
                .values().stream()
                .map(list -> {
                    String     nome     = list.get(0).getProduto().getNome();
                    BigDecimal qtdTotal = list.stream().map(PedidoProduto::getQuantidade)
                                              .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal valor    = list.stream()
                                              .map(pp -> PedidoMapper.calcTotal(
                                                      pp.getPrecoUnitario(), pp.getQuantidade(),
                                                      pp.getTipoAjuste(), pp.getTipoCalculo(), pp.getValorAjuste()))
                                              .reduce(BigDecimal.ZERO, BigDecimal::add)
                                              .setScale(2, RoundingMode.HALF_UP);
                    return new ProdutoRankingDto(nome, list.size(), qtdTotal, valor);
                })
                .sorted(Comparator.comparing(ProdutoRankingDto::valorTotal).reversed())
                .limit(10)
                .toList();

        // ── porEmitente (só concluídos) ───────────────────────────────────────────
        List<EmitenteRankingDto> porEmitente = concluidos.stream()
                .collect(Collectors.groupingBy(p -> p.getEmitente().getId()))
                .values().stream()
                .map(list -> {
                    Pedido ref = list.get(0);
                    BigDecimal valor = list.stream()
                            .map(p -> valorPorPedido.getOrDefault(p.getId(), BigDecimal.ZERO))
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .setScale(2, RoundingMode.HALF_UP);
                    return new EmitenteRankingDto(
                            ref.getEmitente().getId(),
                            ref.getEmitente().getPessoa().getNome(),
                            ref.getEmitente().getCor(),
                            list.size(),
                            valor);
                })
                .sorted(Comparator.comparing(EmitenteRankingDto::valor).reversed())
                .limit(10)
                .toList();

        // ── Clientes mais frequentes (só concluídos) ──────────────────────────────
        List<ClienteRankingDto> clientesMaisFieis = concluidos.stream()
                .collect(Collectors.groupingBy(p -> p.getPessoa().getId()))
                .values().stream()
                .map(list -> {
                    Pedido ref = list.get(0);
                    BigDecimal valor = list.stream()
                            .map(p -> valorPorPedido.getOrDefault(p.getId(), BigDecimal.ZERO))
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .setScale(2, RoundingMode.HALF_UP);
                    return new ClienteRankingDto(
                            ref.getPessoa().getId(),
                            ref.getPessoa().getNome(),
                            list.size(),
                            valor);
                })
                .sorted(Comparator.comparingLong(ClienteRankingDto::pedidos).reversed())
                .limit(10)
                .toList();

        // ── Por dia da semana (só concluídos) ─────────────────────────────────────
        Map<Integer, List<Pedido>> porDow = concluidos.stream()
                .collect(Collectors.groupingBy(p -> p.getDataPedido().getDayOfWeek().getValue() % 7));

        List<DiaSemanaDto> porDiaSemana = new ArrayList<>(7);
        for (int i = 0; i < 7; i++) {
            List<Pedido> lista = porDow.getOrDefault(i, List.of());
            BigDecimal   valor = lista.stream()
                    .map(p -> valorPorPedido.getOrDefault(p.getId(), BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            porDiaSemana.add(new DiaSemanaDto(DIAS_PT[i], lista.size(), valor));
        }

        return new PedidoDashboardDto(
                totalPedidos, totalAbertos, totalConcluidos, totalCancelados,
                valorTotal, valorMes, ticketMedio,
                porStatus, porPeriodo, porTipoPedido,
                produtosMaisVendidos, porEmitente, clientesMaisFieis, porDiaSemana
        );
    }

    /** Buckets mensais contínuos (preenche meses vazios), limitado a 12 meses terminando em `ate`. */
    private List<PeriodoDto> montarPorPeriodo(
            List<Pedido> concluidos, Map<Long, BigDecimal> valorPorPedido,
            LocalDateTime desde, LocalDateTime ate
    ) {
        YearMonth fimMes = YearMonth.from(ate);

        Map<YearMonth, List<Pedido>> porMes = concluidos.stream()
                .collect(Collectors.groupingBy(p -> YearMonth.from(p.getDataPedido())));

        YearMonth desdeMes = YearMonth.from(desde);
        YearMonth limite   = fimMes.minusMonths(11);
        YearMonth inicio   = desdeMes.isAfter(limite) ? desdeMes : limite;

        List<PeriodoDto> periodos = new ArrayList<>();
        for (YearMonth ym = inicio; !ym.isAfter(fimMes); ym = ym.plusMonths(1)) {
            List<Pedido> lista = porMes.getOrDefault(ym, List.of());
            BigDecimal   valor = lista.stream()
                    .map(p -> valorPorPedido.getOrDefault(p.getId(), BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            periodos.add(new PeriodoDto(ym.atDay(1).format(MES_FMT), lista.size(), valor));
        }
        return periodos;
    }
}
