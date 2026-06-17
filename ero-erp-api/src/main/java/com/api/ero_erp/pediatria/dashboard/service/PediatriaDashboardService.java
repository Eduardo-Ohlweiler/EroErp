package com.api.ero_erp.pediatria.dashboard.service;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.pediatria.dashboard.dto.PediatriaGeralDashboardDto;
import com.api.ero_erp.pediatria.dashboard.dto.PediatriaGeralDashboardDto.*;
import com.api.ero_erp.pediatria.dashboard.dto.PediatriaPacienteDashboardDto;
import com.api.ero_erp.pediatria.dashboard.dto.PediatriaPacienteDashboardDto.HistoricoFormulaDto;
import com.api.ero_erp.pediatria.dashboard.dto.PediatriaPacienteDashboardDto.PontoEvolutivoDto;
import com.api.ero_erp.pediatria.dashboard.dto.PediatriaPacienteDashboardDto.UltimaAvaliacaoDto;
import com.api.ero_erp.pediatria.entity.AvaliacaoPediatrica;
import com.api.ero_erp.pediatria.repository.AvaliacaoPediatricaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PediatriaDashboardService {

    private static final LocalDate           EPOCH   = LocalDate.of(1900, 1, 1);
    private static final DateTimeFormatter   MES_FMT = DateTimeFormatter.ofPattern("MM/yy");

    /** Faixas etárias fixas em meses: [min inclusivo, max exclusivo). A última é aberta (60+). */
    private static final int[]    FAIXA_LIMITES = {0, 6, 12, 24, 36, 60};
    private static final String[] FAIXA_LABELS  = {"0-6", "6-12", "12-24", "24-36", "36-60", "60+"};

    private final AvaliacaoPediatricaRepository repository;
    private final SecurityUtils                 securityUtils;

    public PediatriaDashboardService(
            AvaliacaoPediatricaRepository repository,
            SecurityUtils                 securityUtils
    ) {
        this.repository    = repository;
        this.securityUtils = securityUtils;
    }

    // ── Dashboard do paciente ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PediatriaPacienteDashboardDto getPacienteDashboard(
            Long pessoaId, int dias, Long formulaLacteaId, Integer mesesMin, Integer mesesMax
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();

        LocalDate desde = dias > 0 ? LocalDate.now().minusDays(dias) : EPOCH;
        LocalDate ate   = LocalDate.now();

        // sexo não é filtro do dashboard do paciente
        List<AvaliacaoPediatrica> avaliacoes = repository.findForDashboard(
                clienteId, pessoaId, desde, ate, formulaLacteaId, mesesMin, mesesMax, null);

        if (avaliacoes.isEmpty()) {
            return new PediatriaPacienteDashboardDto(
                    pessoaId, null, null, null, null,
                    0L, null, null, null,
                    List.of(), List.of());
        }

        // Última avaliação = maior dataAvaliacao (desempate por idadeMeses)
        AvaliacaoPediatrica ultima = avaliacoes.stream()
                .max(Comparator.comparing(AvaliacaoPediatrica::getDataAvaliacao)
                        .thenComparing(a -> a.getIdadeMeses() == null ? Integer.MIN_VALUE : a.getIdadeMeses()))
                .orElseThrow();

        LocalDate primeira = avaliacoes.stream()
                .map(AvaliacaoPediatrica::getDataAvaliacao)
                .min(Comparator.naturalOrder())
                .orElse(null);

        LocalDate dataNascimento = ultima.getPessoa().getDataNascimento();
        Integer idadeMesesAtual = dataNascimento != null
                ? (int) Period.between(dataNascimento, LocalDate.now()).toTotalMonths()
                : ultima.getIdadeMeses();

        UltimaAvaliacaoDto ultimaDto = new UltimaAvaliacaoDto(
                ultima.getPeso(),
                ultima.getEstatura(),
                ultima.getImc(),
                ultima.getClassifPesoIdade(),
                ultima.getClassifEstaturaIdade(),
                ultima.getClassifImcIdade(),
                ultima.getVet(),
                ultima.getProteinaNecessidade(),
                ultima.getFormulaNome(),
                ultima.getCaloriasTotais(),
                ultima.getProteinaTotal(),
                ultima.getPercCalorico(),
                ultima.getPercProteico(),
                ultima.getObservacao(),
                ultima.getDataAvaliacao(),
                ultima.getIdadeMeses()
        );

        // Evolução ordenada por idadeMeses asc (a query já vem nessa ordem; reforça por segurança)
        List<PontoEvolutivoDto> evolucao = avaliacoes.stream()
                .sorted(Comparator
                        .comparing((AvaliacaoPediatrica a) -> a.getIdadeMeses() == null ? Integer.MIN_VALUE : a.getIdadeMeses())
                        .thenComparing(AvaliacaoPediatrica::getDataAvaliacao))
                .map(a -> new PontoEvolutivoDto(
                        a.getDataAvaliacao(),
                        a.getIdadeMeses(),
                        a.getPeso(),
                        a.getEstatura(),
                        a.getImc(),
                        a.getVet(),
                        a.getCaloriasTotais(),
                        a.getProteinaTotal(),
                        a.getProteinaNecessidade(),
                        a.getPercCalorico(),
                        a.getPercProteico(),
                        a.getFormulaNome(),
                        a.getClassifPesoIdade(),
                        a.getClassifEstaturaIdade(),
                        a.getClassifImcIdade()))
                .toList();

        List<HistoricoFormulaDto> historicoFormulas = avaliacoes.stream()
                .filter(a -> a.getFormulaNome() != null)
                .sorted(Comparator.comparing(AvaliacaoPediatrica::getDataAvaliacao))
                .map(a -> new HistoricoFormulaDto(
                        a.getDataAvaliacao(),
                        a.getIdadeMeses(),
                        a.getFormulaNome(),
                        a.getVolumeTotal(),
                        a.getVezesDia()))
                .toList();

        return new PediatriaPacienteDashboardDto(
                ultima.getPessoa().getId(),
                ultima.getPessoa().getNome(),
                ultima.getSexo(),
                dataNascimento,
                idadeMesesAtual,
                avaliacoes.size(),
                primeira,
                ultima.getDataAvaliacao(),
                ultimaDto,
                evolucao,
                historicoFormulas
        );
    }

    // ── Dashboard geral ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PediatriaGeralDashboardDto getGeralDashboard(
            int dias, Long formulaLacteaId, Integer mesesMin, Integer mesesMax, String sexo
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();

        LocalDate desde = dias > 0 ? LocalDate.now().minusDays(dias) : EPOCH;
        LocalDate ate   = LocalDate.now();

        List<AvaliacaoPediatrica> avaliacoes = repository.findForDashboard(
                clienteId, null, desde, ate, formulaLacteaId, mesesMin, mesesMax, sexo);

        // ── KPIs ──────────────────────────────────────────────────────────────
        long totalAvaliacoes = avaliacoes.size();

        long totalPacientes = avaliacoes.stream()
                .map(a -> a.getPessoa().getId())
                .distinct()
                .count();

        YearMonth mesAtual = YearMonth.now();
        long avaliacoesMes = avaliacoes.stream()
                .filter(a -> YearMonth.from(a.getDataAvaliacao()).equals(mesAtual))
                .count();

        BigDecimal idadeMediaMeses = mediaInt(
                avaliacoes.stream().map(AvaliacaoPediatrica::getIdadeMeses).toList(), 1);
        BigDecimal pesoMedio = mediaBd(
                avaliacoes.stream().map(AvaliacaoPediatrica::getPeso).toList(), 2);
        BigDecimal imcMedio = mediaBd(
                avaliacoes.stream().map(AvaliacaoPediatrica::getImc).toList(), 2);
        BigDecimal coberturaCaloricaMedia = mediaBd(
                avaliacoes.stream().map(AvaliacaoPediatrica::getPercCalorico).toList(), 1);

        long comImc = avaliacoes.stream()
                .filter(a -> a.getClassifImcIdade() != null)
                .count();
        long imcAdequado = avaliacoes.stream()
                .filter(a -> isImcAdequado(a.getClassifImcIdade()))
                .count();
        BigDecimal percImcAdequado = comImc > 0
                ? BigDecimal.valueOf(imcAdequado * 100)
                        .divide(BigDecimal.valueOf(comImc), 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);

        // ── porPeriodo (buckets mensais contínuos, 12 meses) ────────────────────
        List<PeriodoDto> porPeriodo = montarPorPeriodo(avaliacoes, desde);

        // ── Distribuições por classificação ─────────────────────────────────────
        List<ClassificacaoDto> porClassifPesoIdade =
                contarPorClassificacao(avaliacoes, AvaliacaoPediatrica::getClassifPesoIdade);
        List<ClassificacaoDto> porClassifEstaturaIdade =
                contarPorClassificacao(avaliacoes, AvaliacaoPediatrica::getClassifEstaturaIdade);
        List<ClassificacaoDto> porClassifImcIdade =
                contarPorClassificacao(avaliacoes, AvaliacaoPediatrica::getClassifImcIdade);

        // ── porFormula (desc) ───────────────────────────────────────────────────
        List<FormulaDto> porFormula = avaliacoes.stream()
                .filter(a -> a.getFormulaNome() != null)
                .collect(Collectors.groupingBy(AvaliacaoPediatrica::getFormulaNome, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new FormulaDto(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(FormulaDto::quantidade).reversed()
                        .thenComparing(FormulaDto::formulaNome))
                .toList();

        // ── porFaixaEtaria (faixas fixas, inclui zeros, mantém ordem) ───────────
        List<FaixaEtariaDto> porFaixaEtaria = montarPorFaixaEtaria(avaliacoes);

        // ── porSexo ─────────────────────────────────────────────────────────────
        List<SexoDto> porSexo = avaliacoes.stream()
                .filter(a -> a.getSexo() != null)
                .collect(Collectors.groupingBy(AvaliacaoPediatrica::getSexo, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new SexoDto(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(SexoDto::sexo))
                .toList();

        // ── pacientesMaisAvaliados (top 10 desc) ────────────────────────────────
        List<PacienteRankingDto> pacientesMaisAvaliados = avaliacoes.stream()
                .collect(Collectors.groupingBy(a -> a.getPessoa().getId()))
                .values().stream()
                .map(list -> {
                    AvaliacaoPediatrica ref = list.get(0);
                    return new PacienteRankingDto(
                            ref.getPessoa().getId(),
                            ref.getPessoa().getNome(),
                            list.size());
                })
                .sorted(Comparator.comparingLong(PacienteRankingDto::avaliacoes).reversed()
                        .thenComparing(PacienteRankingDto::pessoaNome))
                .limit(10)
                .toList();

        return new PediatriaGeralDashboardDto(
                totalAvaliacoes, totalPacientes, avaliacoesMes,
                idadeMediaMeses, pesoMedio, imcMedio, percImcAdequado, coberturaCaloricaMedia,
                porPeriodo,
                porClassifPesoIdade, porClassifEstaturaIdade, porClassifImcIdade,
                porFormula, porFaixaEtaria, porSexo, pacientesMaisAvaliados
        );
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    /** Considera adequado quando a classificação de IMC contém "adequado" (ex.: "IMC adequado"). */
    private boolean isImcAdequado(String classif) {
        return classif != null && classif.toLowerCase(Locale.ROOT).contains("adequado");
    }

    /** Agrupa por uma classificação textual, ignorando null, ordenado desc por quantidade. */
    private List<ClassificacaoDto> contarPorClassificacao(
            List<AvaliacaoPediatrica> avaliacoes,
            java.util.function.Function<AvaliacaoPediatrica, String> extrator
    ) {
        return avaliacoes.stream()
                .map(extrator)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(c -> c, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new ClassificacaoDto(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(ClassificacaoDto::quantidade).reversed()
                        .thenComparing(ClassificacaoDto::classificacao))
                .toList();
    }

    /** Faixas etárias fixas; inclui faixas com zero para manter a ordem. >=60 cai em "60+". */
    private List<FaixaEtariaDto> montarPorFaixaEtaria(List<AvaliacaoPediatrica> avaliacoes) {
        long[] contagem = new long[FAIXA_LABELS.length];
        for (AvaliacaoPediatrica a : avaliacoes) {
            Integer meses = a.getIdadeMeses();
            if (meses == null) continue;
            contagem[faixaIndex(meses)]++;
        }
        List<FaixaEtariaDto> faixas = new ArrayList<>(FAIXA_LABELS.length);
        for (int i = 0; i < FAIXA_LABELS.length; i++) {
            faixas.add(new FaixaEtariaDto(FAIXA_LABELS[i], contagem[i]));
        }
        return faixas;
    }

    /** Índice da faixa para uma idade em meses; última faixa ("60+") é aberta. */
    private int faixaIndex(int meses) {
        for (int i = 0; i < FAIXA_LIMITES.length - 1; i++) {
            if (meses >= FAIXA_LIMITES[i] && meses < FAIXA_LIMITES[i + 1]) return i;
        }
        // meses >= 60 (ou negativo improvável) → última faixa
        return FAIXA_LABELS.length - 1;
    }

    /**
     * Agrupa avaliações por YearMonth de dataAvaliacao e gera buckets contínuos
     * (preenchendo meses vazios), limitado a 12 meses até o mês atual.
     * Adaptado de ConsultaDashboardAnaliticoService.montarPorPeriodo.
     */
    private List<PeriodoDto> montarPorPeriodo(List<AvaliacaoPediatrica> avaliacoes, LocalDate desde) {
        YearMonth mesAtual = YearMonth.now();

        Map<YearMonth, Long> porMes = avaliacoes.stream()
                .collect(Collectors.groupingBy(
                        a -> YearMonth.from(a.getDataAvaliacao()), Collectors.counting()));

        // Início = max(desde, hoje-11meses); janela máxima de 12 meses até o mês atual.
        YearMonth desdeMes = YearMonth.from(desde);
        YearMonth limite   = mesAtual.minusMonths(11);
        YearMonth inicio   = desdeMes.isAfter(limite) ? desdeMes : limite;

        List<PeriodoDto> periodos = new ArrayList<>();
        for (YearMonth ym = inicio; !ym.isAfter(mesAtual); ym = ym.plusMonths(1)) {
            long qtd = porMes.getOrDefault(ym, 0L);
            periodos.add(new PeriodoDto(ym.atDay(1).format(MES_FMT), qtd));
        }
        return periodos;
    }

    /** Média de uma lista de BigDecimal (ignorando null), com a escala informada; 0 se vazia. */
    private BigDecimal mediaBd(List<BigDecimal> valores, int scale) {
        List<BigDecimal> validos = valores.stream().filter(Objects::nonNull).toList();
        if (validos.isEmpty()) return BigDecimal.ZERO.setScale(scale, RoundingMode.HALF_UP);
        BigDecimal soma = validos.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return soma.divide(BigDecimal.valueOf(validos.size()), scale, RoundingMode.HALF_UP);
    }

    /** Média de uma lista de Integer (ignorando null), com a escala informada; 0 se vazia. */
    private BigDecimal mediaInt(List<Integer> valores, int scale) {
        List<Integer> validos = valores.stream().filter(Objects::nonNull).toList();
        if (validos.isEmpty()) return BigDecimal.ZERO.setScale(scale, RoundingMode.HALF_UP);
        long soma = validos.stream().mapToLong(Integer::longValue).sum();
        return BigDecimal.valueOf(soma)
                .divide(BigDecimal.valueOf(validos.size()), scale, RoundingMode.HALF_UP);
    }
}
