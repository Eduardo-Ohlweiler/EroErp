package com.api.ero_erp.documento.service;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.documento.dtos.DocumentoDashboardDto;
import com.api.ero_erp.documento.dtos.DocumentoDashboardDto.*;
import com.api.ero_erp.documento.entity.Documento;
import com.api.ero_erp.documento.entity.DocumentoStatus;
import com.api.ero_erp.documento.repository.DocumentoRepository;
import com.api.ero_erp.endereco.repository.EnderecoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DocumentoDashboardService {

    private static final LocalDate         EPOCH    = LocalDate.of(1900, 1, 1);
    private static final String            SEM_CIDADE = "Sem cidade";
    private static final DateTimeFormatter MES_FMT  = DateTimeFormatter.ofPattern("MM/yy");

    private final DocumentoRepository documentoRepository;
    private final EnderecoRepository  enderecoRepository;
    private final SecurityUtils       securityUtils;

    public DocumentoDashboardService(
            DocumentoRepository documentoRepository,
            EnderecoRepository  enderecoRepository,
            SecurityUtils       securityUtils
    ) {
        this.documentoRepository = documentoRepository;
        this.enderecoRepository  = enderecoRepository;
        this.securityUtils       = securityUtils;
    }

    /** Cidade resolvida de uma pessoa (id pode ser null no bucket "Sem cidade"). */
    private record CidadeInfo(Long id, String nome, String uf) {}

    @Transactional(readOnly = true)
    public DocumentoDashboardDto getDashboard(int dias, Long emitenteId, DocumentoStatus status, Long cidadeId) {
        Long clienteId = securityUtils.getClienteIdLogado();

        LocalDate desde     = dias > 0 ? LocalDate.now().minusDays(dias) : EPOCH;
        YearMonth mesAtual  = YearMonth.now();

        List<Documento> docs = documentoRepository.findForDashboard(clienteId, desde, emitenteId, status);

        // ── Resolve cidade por pessoa ─────────────────────────────────────────────
        // ORDER BY principal DESC + putIfAbsent → o endereço principal vence;
        // se não houver principal, qualquer endereço da pessoa é usado.
        Map<Long, CidadeInfo> cidadePorPessoa = new HashMap<>();
        for (Object[] row : enderecoRepository.findCidadesPorPessoa(clienteId)) {
            Long pessoaId = (Long) row[0];
            cidadePorPessoa.putIfAbsent(
                    pessoaId,
                    new CidadeInfo((Long) row[1], (String) row[2], (String) row[3])
            );
        }

        CidadeInfo semCidade = new CidadeInfo(null, SEM_CIDADE, null);
        Map<Long, CidadeInfo> cidadeDoDoc = new HashMap<>(docs.size());
        for (Documento d : docs) {
            cidadeDoDoc.put(d.getId(),
                    cidadePorPessoa.getOrDefault(d.getClientePessoa().getId(), semCidade));
        }

        // Filtro de cidade aplicado em Java (cidadeId == null → ignora filtro)
        if (cidadeId != null) {
            docs = docs.stream()
                    .filter(d -> {
                        Long c = cidadeDoDoc.get(d.getId()).id();
                        return cidadeId.equals(c);
                    })
                    .toList();
        }

        // ── KPIs de contagem + porStatus → TODOS os docs da base ──────────────────
        long totalDocumentos = docs.size();
        Map<DocumentoStatus, List<Documento>> porStatusMap = docs.stream()
                .collect(Collectors.groupingBy(Documento::getStatus));

        long totalEmitidos   = porStatusMap.getOrDefault(DocumentoStatus.EMITIDO,   List.of()).size();
        long totalRascunhos  = porStatusMap.getOrDefault(DocumentoStatus.RASCUNHO,  List.of()).size();
        long totalCancelados = porStatusMap.getOrDefault(DocumentoStatus.CANCELADO, List.of()).size();

        List<StatusDistribuicaoDto> porStatus = porStatusMap.entrySet().stream()
                .map(e -> new StatusDistribuicaoDto(
                        e.getKey().name(),
                        e.getValue().size(),
                        somaValorFinal(e.getValue())))
                .sorted(Comparator.comparingLong(StatusDistribuicaoDto::quantidade).reversed())
                .toList();

        // ── Escopo de valores/rankings: "emitidos" ────────────────────────────────
        // Se um status foi filtrado, a base já está restrita àquele status → usa tudo.
        // Senão, considera apenas os documentos EMITIDO.
        List<Documento> emitidos = status != null
                ? docs
                : docs.stream().filter(d -> d.getStatus() == DocumentoStatus.EMITIDO).toList();

        // ── KPIs de valor (sobre "emitidos") ──────────────────────────────────────
        BigDecimal valorTotalEmitido = somaValorFinal(emitidos);
        BigDecimal ticketMedio = emitidos.isEmpty()
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : valorTotalEmitido.divide(BigDecimal.valueOf(emitidos.size()), 2, RoundingMode.HALF_UP);
        BigDecimal valorEmitidoMes = emitidos.stream()
                .filter(d -> YearMonth.from(d.getDataEmissao()).equals(mesAtual))
                .map(this::valorFinal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        // ── porPeriodo (sobre "emitidos") ─────────────────────────────────────────
        List<PeriodoDto> porPeriodo = montarPorPeriodo(emitidos, desde, mesAtual);

        // ── porEmitente (sobre "emitidos") ────────────────────────────────────────
        List<EmitenteRankingDto> porEmitente = emitidos.stream()
                .collect(Collectors.groupingBy(d -> d.getEmitente().getId()))
                .values().stream()
                .map(list -> {
                    Documento ref = list.get(0);
                    return new EmitenteRankingDto(
                            ref.getEmitente().getId(),
                            ref.getEmitente().getPessoa().getNome(),
                            ref.getEmitente().getCor(),
                            list.size(),
                            somaValorFinal(list));
                })
                .sorted(Comparator.comparingLong(EmitenteRankingDto::quantidade).reversed())
                .limit(10)
                .toList();

        // ── porCidade (sobre "emitidos") ──────────────────────────────────────────
        List<CidadeRankingDto> porCidade = emitidos.stream()
                .collect(Collectors.groupingBy(d -> cidadeDoDoc.get(d.getId())))
                .entrySet().stream()
                .map(e -> new CidadeRankingDto(
                        e.getKey().id(),
                        e.getKey().nome(),
                        e.getKey().uf(),
                        e.getValue().size(),
                        somaValorFinal(e.getValue())))
                .sorted(Comparator.comparingLong(CidadeRankingDto::quantidade).reversed())
                .limit(10)
                .toList();

        // ── porPessoa (sobre "emitidos") ──────────────────────────────────────────
        List<PessoaRankingDto> porPessoa = emitidos.stream()
                .collect(Collectors.groupingBy(d -> d.getClientePessoa().getId()))
                .values().stream()
                .map(list -> {
                    Documento ref = list.get(0);
                    return new PessoaRankingDto(
                            ref.getClientePessoa().getId(),
                            ref.getClientePessoa().getNome(),
                            list.size(),
                            somaValorFinal(list));
                })
                .sorted(Comparator.comparingLong(PessoaRankingDto::quantidade).reversed())
                .limit(10)
                .toList();

        return new DocumentoDashboardDto(
                totalDocumentos, totalEmitidos, totalRascunhos, totalCancelados,
                valorTotalEmitido, valorEmitidoMes, ticketMedio,
                porStatus, porPeriodo, porEmitente, porCidade, porPessoa
        );
    }

    /** Agrupa por YearMonth e gera buckets contínuos (preenchendo meses vazios), limitado a 12 meses. */
    private List<PeriodoDto> montarPorPeriodo(List<Documento> emitidos, LocalDate desde, YearMonth mesAtual) {
        Map<YearMonth, List<Documento>> porMes = emitidos.stream()
                .collect(Collectors.groupingBy(d -> YearMonth.from(d.getDataEmissao())));

        // Início = max(desde, hoje-12meses); janela máxima de 12 meses até o mês atual.
        YearMonth desdeMes = YearMonth.from(desde);
        YearMonth limite   = mesAtual.minusMonths(11);
        YearMonth inicio   = desdeMes.isAfter(limite) ? desdeMes : limite;

        List<PeriodoDto> periodos = new ArrayList<>();
        for (YearMonth ym = inicio; !ym.isAfter(mesAtual); ym = ym.plusMonths(1)) {
            List<Documento> lista = porMes.getOrDefault(ym, List.of());
            periodos.add(new PeriodoDto(
                    ym.atDay(1).format(MES_FMT),
                    lista.size(),
                    somaValorFinal(lista)));
        }
        return periodos;
    }

    private BigDecimal somaValorFinal(List<Documento> list) {
        return list.stream()
                .map(this::valorFinal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal valorFinal(Documento d) {
        return d.getValorFinal() != null ? d.getValorFinal() : BigDecimal.ZERO;
    }
}
