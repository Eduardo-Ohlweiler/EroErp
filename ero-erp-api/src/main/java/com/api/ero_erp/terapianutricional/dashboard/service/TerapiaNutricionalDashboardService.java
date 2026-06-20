package com.api.ero_erp.terapianutricional.dashboard.service;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.terapianutricional.dashboard.dto.TerapiaNutricionalAcompanhamentoDashboardDto;
import com.api.ero_erp.terapianutricional.dashboard.dto.TerapiaNutricionalAcompanhamentoDashboardDto.PontoDiarioDto;
import com.api.ero_erp.terapianutricional.dashboard.dto.TerapiaNutricionalAcompanhamentoDashboardDto.UltimoRegistroDto;
import com.api.ero_erp.terapianutricional.dashboard.dto.TerapiaNutricionalGeralDashboardDto;
import com.api.ero_erp.terapianutricional.dashboard.dto.TerapiaNutricionalGeralDashboardDto.ContagemDto;
import com.api.ero_erp.terapianutricional.dashboard.dto.TerapiaNutricionalPacienteDashboardDto;
import com.api.ero_erp.terapianutricional.dashboard.dto.TerapiaNutricionalPacienteDashboardDto.PontoEvolutivoDto;
import com.api.ero_erp.terapianutricional.dashboard.dto.TerapiaNutricionalPacienteDashboardDto.UltimaAvaliacaoDto;
import com.api.ero_erp.terapianutricional.entity.AvaliacaoNutricionalUti;
import com.api.ero_erp.terapianutricional.entity.RegistroDiarioUti;
import com.api.ero_erp.terapianutricional.repository.AvaliacaoNutricionalUtiRepository;
import com.api.ero_erp.terapianutricional.repository.RegistroDiarioUtiRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class TerapiaNutricionalDashboardService {

    private static final LocalDate EPOCH = LocalDate.of(1900, 1, 1);

    private final AvaliacaoNutricionalUtiRepository repository;
    private final RegistroDiarioUtiRepository       registroRepository;
    private final SecurityUtils                     securityUtils;

    public TerapiaNutricionalDashboardService(
            AvaliacaoNutricionalUtiRepository repository,
            RegistroDiarioUtiRepository       registroRepository,
            SecurityUtils                     securityUtils
    ) {
        this.repository         = repository;
        this.registroRepository = registroRepository;
        this.securityUtils      = securityUtils;
    }

    @Transactional(readOnly = true)
    public TerapiaNutricionalPacienteDashboardDto getPacienteDashboard(Long pessoaId, int dias) {
        Long clienteId = securityUtils.getClienteIdLogado();

        LocalDate desde = dias > 0 ? LocalDate.now().minusDays(dias) : EPOCH;
        LocalDate ate   = LocalDate.now();

        List<AvaliacaoNutricionalUti> avaliacoes =
                repository.findForDashboard(clienteId, pessoaId, desde, ate);

        if (avaliacoes.isEmpty()) {
            return new TerapiaNutricionalPacienteDashboardDto(
                    pessoaId, null, 0L, null, null, null, List.of());
        }

        AvaliacaoNutricionalUti ultima = avaliacoes.stream()
                .max(Comparator.comparing(AvaliacaoNutricionalUti::getDataAvaliacao))
                .orElseThrow();

        LocalDate primeira = avaliacoes.stream()
                .map(AvaliacaoNutricionalUti::getDataAvaliacao)
                .min(Comparator.naturalOrder())
                .orElse(null);

        UltimaAvaliacaoDto ultimaDto = new UltimaAvaliacaoDto(
                ultima.getPesoAtual(),
                ultima.getImc(),
                ultima.getClassifImcOms(),
                ultima.getPesoIdeal(),
                ultima.getPesoAjustado(),
                ultima.getPercAdequacaoCb(),
                ultima.getKcalTotal(),
                ultima.getPtnTotal(),
                ultima.getDietaKcal(),
                ultima.getDietaPtn(),
                ultima.getDietaPercVct(),
                ultima.getDietaPercPtn(),
                ultima.getFormulaNome(),
                ultima.getDataAvaliacao()
        );

        // Evolução ordenada por dataAvaliacao asc (a query já vem nessa ordem; reforça por segurança)
        List<PontoEvolutivoDto> evolucao = avaliacoes.stream()
                .sorted(Comparator.comparing(AvaliacaoNutricionalUti::getDataAvaliacao))
                .map(a -> new PontoEvolutivoDto(
                        a.getDataAvaliacao(),
                        a.getPesoAtual(),
                        a.getImc(),
                        a.getPercAdequacaoCb(),
                        a.getKcalTotal(),
                        a.getPtnTotal(),
                        a.getDietaKcal(),
                        a.getDietaPtn(),
                        a.getDietaPercVct(),
                        a.getDietaPercPtn(),
                        a.getCb(),
                        a.getCp()))
                .toList();

        return new TerapiaNutricionalPacienteDashboardDto(
                ultima.getPessoa().getId(),
                ultima.getPessoa().getNome(),
                avaliacoes.size(),
                primeira,
                ultima.getDataAvaliacao(),
                ultimaDto,
                evolucao
        );
    }

    // ── Painel de Acompanhamento Diário ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public TerapiaNutricionalAcompanhamentoDashboardDto getAcompanhamentoDashboard(Long pessoaId, int dias) {
        Long clienteId = securityUtils.getClienteIdLogado();

        LocalDate desde = dias > 0 ? LocalDate.now().minusDays(dias) : EPOCH;
        LocalDate ate   = LocalDate.now();

        List<RegistroDiarioUti> registros =
                registroRepository.findForDashboard(clienteId, pessoaId, desde, ate);

        if (registros.isEmpty()) {
            return new TerapiaNutricionalAcompanhamentoDashboardDto(
                    pessoaId, null, 0L, null, null, null, List.of());
        }

        RegistroDiarioUti ultimo = registros.stream()
                .max(Comparator.comparing(RegistroDiarioUti::getData))
                .orElseThrow();

        LocalDate primeiro = registros.stream()
                .map(RegistroDiarioUti::getData)
                .min(Comparator.naturalOrder())
                .orElse(null);

        UltimoRegistroDto ultimoDto = new UltimoRegistroDto(
                ultimo.getData(),
                ultimo.getDieta(),
                ultimo.getPercRecebidoNe(),
                ultimo.getVolPrescrito24h(),
                ultimo.getVolRecebido24h(),
                mediaIngestao(ultimo),
                ultimo.getBh(),
                ultimo.getDiurese(),
                ultimo.getK(),
                ultimo.getNa(),
                ultimo.getMg(),
                ultimo.getLact(),
                ultimo.getPcr(),
                ultimo.getPh(),
                ultimo.getPco2(),
                ultimo.getHco3()
        );

        List<PontoDiarioDto> evolucao = registros.stream()
                .sorted(Comparator.comparing(RegistroDiarioUti::getData))
                .map(r -> new PontoDiarioDto(
                        r.getData(),
                        r.getVolPrescrito24h(),
                        r.getVolRecebido24h(),
                        r.getPercRecebidoNe(),
                        mediaIngestao(r),
                        r.getK(),
                        r.getNa(),
                        r.getMg(),
                        r.getLact(),
                        r.getPcr(),
                        r.getPh(),
                        r.getPco2(),
                        r.getHco3(),
                        r.getBh(),
                        r.getDiurese()))
                .toList();

        return new TerapiaNutricionalAcompanhamentoDashboardDto(
                ultimo.getPessoa().getId(),
                ultimo.getPessoa().getNome(),
                registros.size(),
                primeiro,
                ultimo.getData(),
                ultimoDto,
                evolucao
        );
    }

    /** Média (%) das 6 refeições não-nulas do registro — espelha a média do form. */
    private static BigDecimal mediaIngestao(RegistroDiarioUti r) {
        List<BigDecimal> vals = Stream.of(
                        r.getCafeManha(), r.getLancheManha(), r.getAlmoco(),
                        r.getLancheTarde(), r.getJantar(), r.getCeia())
                .filter(Objects::nonNull)
                .toList();
        if (vals.isEmpty()) return null;
        BigDecimal soma = vals.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return soma.divide(BigDecimal.valueOf(vals.size()), 2, RoundingMode.HALF_UP);
    }

    // ── Dashboard geral ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TerapiaNutricionalGeralDashboardDto getGeralDashboard(LocalDate dataInicio, LocalDate dataFim) {
        Long clienteId = securityUtils.getClienteIdLogado();

        LocalDate ate   = dataFim    != null ? dataFim    : LocalDate.now();
        LocalDate desde = dataInicio != null ? dataInicio : ate.minusDays(365);

        List<AvaliacaoNutricionalUti> avaliacoes =
                repository.findForDashboardGeral(clienteId, desde, ate);

        long totalAvaliacoes = avaliacoes.size();
        long totalPacientes = avaliacoes.stream()
                .map(a -> a.getPessoa().getId())
                .distinct()
                .count();
        long avaliacoesNoPeriodo = totalAvaliacoes; // janela = período consultado

        BigDecimal mediaKcalKg = mediaBd(
                avaliacoes.stream().map(AvaliacaoNutricionalUti::getDietaKcalKg).toList(), 2);
        BigDecimal mediaPtnKg = mediaBd(
                avaliacoes.stream().map(AvaliacaoNutricionalUti::getDietaPtnKg).toList(), 2);

        List<ContagemDto> porClassificacaoImc =
                contarPor(avaliacoes, AvaliacaoNutricionalUti::getClassifImcOms);
        List<ContagemDto> porFase =
                contarPor(avaliacoes, AvaliacaoNutricionalUti::getFase);
        List<ContagemDto> porFormula = contarPor(avaliacoes, AvaliacaoNutricionalUti::getFormulaNome)
                .stream()
                .limit(10)
                .toList();

        List<ContagemDto> rankingPacientes = avaliacoes.stream()
                .collect(Collectors.groupingBy(a -> a.getPessoa().getId()))
                .values().stream()
                .map(list -> new ContagemDto(list.get(0).getPessoa().getNome(), list.size()))
                .sorted(Comparator.comparingLong(ContagemDto::total).reversed()
                        .thenComparing(ContagemDto::label))
                .limit(10)
                .toList();

        return new TerapiaNutricionalGeralDashboardDto(
                totalAvaliacoes,
                totalPacientes,
                avaliacoesNoPeriodo,
                mediaKcalKg,
                mediaPtnKg,
                porClassificacaoImc,
                porFase,
                porFormula,
                rankingPacientes
        );
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    /** Agrupa por um rótulo textual, ignorando null, ordenado desc por total. */
    private List<ContagemDto> contarPor(
            List<AvaliacaoNutricionalUti> avaliacoes,
            Function<AvaliacaoNutricionalUti, String> extrator
    ) {
        return avaliacoes.stream()
                .map(extrator)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(c -> c, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new ContagemDto(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(ContagemDto::total).reversed()
                        .thenComparing(ContagemDto::label))
                .toList();
    }

    /** Média de uma lista de BigDecimal (ignorando null), com a escala informada; 0 se vazia. */
    private BigDecimal mediaBd(List<BigDecimal> valores, int scale) {
        List<BigDecimal> validos = valores.stream().filter(Objects::nonNull).toList();
        if (validos.isEmpty()) return BigDecimal.ZERO.setScale(scale, RoundingMode.HALF_UP);
        BigDecimal soma = validos.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return soma.divide(BigDecimal.valueOf(validos.size()), scale, RoundingMode.HALF_UP);
    }
}
