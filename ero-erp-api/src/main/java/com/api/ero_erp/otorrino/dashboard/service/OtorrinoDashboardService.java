package com.api.ero_erp.otorrino.dashboard.service;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.otorrino.dashboard.dto.OtorrinoGeralDashboardDto;
import com.api.ero_erp.otorrino.dashboard.dto.OtorrinoGeralDashboardDto.*;
import com.api.ero_erp.otorrino.dashboard.dto.OtorrinoPacienteDashboardDto;
import com.api.ero_erp.otorrino.dashboard.dto.OtorrinoPacienteDashboardDto.AudiometriaPontoDto;
import com.api.ero_erp.otorrino.dashboard.dto.OtorrinoPacienteDashboardDto.EscalaPontoDto;
import com.api.ero_erp.otorrino.dashboard.dto.OtorrinoPacienteDashboardDto.ResumoDto;
import com.api.ero_erp.otorrino.dashboard.dto.OtorrinoPacienteDashboardDto.UltimaAudiometriaDto;
import com.api.ero_erp.otorrino.entity.Audiometria;
import com.api.ero_erp.otorrino.entity.ExameLaudo;
import com.api.ero_erp.otorrino.entity.Imitanciometria;
import com.api.ero_erp.otorrino.entity.QuestionarioAplicado;
import com.api.ero_erp.otorrino.repository.AudiometriaRepository;
import com.api.ero_erp.otorrino.repository.ExameLaudoRepository;
import com.api.ero_erp.otorrino.repository.ImitanciometriaRepository;
import com.api.ero_erp.otorrino.repository.QuestionarioAplicadoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class OtorrinoDashboardService {

    private static final LocalDate         EPOCH      = LocalDate.of(1900, 1, 1);
    private static final DateTimeFormatter PERIODO_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final AudiometriaRepository          audiometriaRepository;
    private final ImitanciometriaRepository      imitanciometriaRepository;
    private final QuestionarioAplicadoRepository questionarioAplicadoRepository;
    private final ExameLaudoRepository           exameLaudoRepository;
    private final SecurityUtils                  securityUtils;

    public OtorrinoDashboardService(
            AudiometriaRepository          audiometriaRepository,
            ImitanciometriaRepository      imitanciometriaRepository,
            QuestionarioAplicadoRepository questionarioAplicadoRepository,
            ExameLaudoRepository           exameLaudoRepository,
            SecurityUtils                  securityUtils
    ) {
        this.audiometriaRepository          = audiometriaRepository;
        this.imitanciometriaRepository      = imitanciometriaRepository;
        this.questionarioAplicadoRepository = questionarioAplicadoRepository;
        this.exameLaudoRepository           = exameLaudoRepository;
        this.securityUtils                  = securityUtils;
    }

    // ── Dashboard do paciente ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OtorrinoPacienteDashboardDto getPacienteDashboard(Long pessoaId, int dias) {
        Long clienteId = securityUtils.getClienteIdLogado();

        LocalDate desde = dias > 0 ? LocalDate.now().minusDays(dias) : EPOCH;
        LocalDate ate   = LocalDate.now();

        List<Audiometria> audiometrias = audiometriaRepository
                .findByPessoaIdAndClienteIdAndDataExameBetween(pessoaId, clienteId, desde, ate);
        List<Imitanciometria> imitanciometrias = imitanciometriaRepository
                .findByPessoaIdAndClienteIdAndDataExameBetween(pessoaId, clienteId, desde, ate);
        List<QuestionarioAplicado> escalas = questionarioAplicadoRepository
                .findByPessoaIdAndClienteIdAndDataAplicacaoBetween(pessoaId, clienteId, desde, ate);
        List<ExameLaudo> laudos = exameLaudoRepository
                .findByPessoaIdAndClienteIdAndDataExameBetween(pessoaId, clienteId, desde, ate);

        // Nome do paciente — pega de qualquer exame disponível
        String pessoaNome = Stream.of(
                        audiometrias.stream().findFirst().map(a -> a.getPessoa().getNome()),
                        imitanciometrias.stream().findFirst().map(i -> i.getPessoa().getNome()),
                        escalas.stream().findFirst().map(e -> e.getPessoa().getNome()),
                        laudos.stream().findFirst().map(l -> l.getPessoa().getNome()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .findFirst()
                .orElse(null);

        List<AudiometriaPontoDto> audiometriaEvolucao = audiometrias.stream()
                .sorted(Comparator.comparing(Audiometria::getDataExame))
                .map(a -> new AudiometriaPontoDto(
                        a.getDataExame(),
                        a.getMediaOd(),
                        a.getMediaOe(),
                        a.getGrauOd() != null ? a.getGrauOd().name() : null,
                        a.getGrauOe() != null ? a.getGrauOe().name() : null))
                .toList();

        List<EscalaPontoDto> escalaEvolucao = escalas.stream()
                .sorted(Comparator.comparing(QuestionarioAplicado::getDataAplicacao))
                .map(e -> new EscalaPontoDto(
                        e.getDataAplicacao(),
                        e.getQuestionario().getCodigo() != null ? e.getQuestionario().getCodigo().name() : null,
                        e.getQuestionario().getNome(),
                        e.getScoreTotal(),
                        e.getClassificacao()))
                .toList();

        ResumoDto resumo = new ResumoDto(
                audiometrias.size(),
                imitanciometrias.size(),
                escalas.size(),
                laudos.size());

        UltimaAudiometriaDto ultimaAudiometria = audiometrias.stream()
                .max(Comparator.comparing(Audiometria::getDataExame))
                .map(a -> new UltimaAudiometriaDto(
                        a.getDataExame(),
                        a.getGrauOd() != null ? a.getGrauOd().name() : null,
                        a.getGrauOe() != null ? a.getGrauOe().name() : null))
                .orElse(null);

        return new OtorrinoPacienteDashboardDto(
                pessoaId,
                pessoaNome,
                audiometriaEvolucao,
                escalaEvolucao,
                resumo,
                ultimaAudiometria);
    }

    // ── Dashboard geral ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OtorrinoGeralDashboardDto getGeralDashboard(int dias) {
        Long clienteId = securityUtils.getClienteIdLogado();

        LocalDate desde = dias > 0 ? LocalDate.now().minusDays(dias) : EPOCH;
        LocalDate ate   = LocalDate.now();

        List<Audiometria> audiometrias = audiometriaRepository
                .findByClienteIdAndDataExameBetween(clienteId, desde, ate);
        List<Imitanciometria> imitanciometrias = imitanciometriaRepository
                .findByClienteIdAndDataExameBetween(clienteId, desde, ate);
        List<QuestionarioAplicado> escalas = questionarioAplicadoRepository
                .findByClienteIdAndDataAplicacaoBetween(clienteId, desde, ate);
        List<ExameLaudo> laudos = exameLaudoRepository
                .findByClienteIdAndDataExameBetween(clienteId, desde, ate);

        // ── KPIs ──────────────────────────────────────────────────────────────
        long totalAudiometrias     = audiometrias.size();
        long totalImitanciometrias = imitanciometrias.size();
        long totalEscalas          = escalas.size();
        long totalLaudos           = laudos.size();

        long totalPacientes = Stream.of(
                        audiometrias.stream().map(a -> a.getPessoa().getId()),
                        imitanciometrias.stream().map(i -> i.getPessoa().getId()),
                        escalas.stream().map(e -> e.getPessoa().getId()),
                        laudos.stream().map(l -> l.getPessoa().getId()))
                .flatMap(s -> s)
                .distinct()
                .count();

        KpisDto kpis = new KpisDto(
                totalAudiometrias, totalImitanciometrias, totalEscalas, totalLaudos, totalPacientes);

        // ── examesPorTipo ───────────────────────────────────────────────────────
        List<ExameTipoDto> examesPorTipo = List.of(
                new ExameTipoDto("Audiometria",     totalAudiometrias),
                new ExameTipoDto("Imitanciometria", totalImitanciometrias),
                new ExameTipoDto("Escala",          totalEscalas),
                new ExameTipoDto("Laudo",           totalLaudos));

        // ── audiometriasPorPeriodo (GROUP BY YearMonth da dataExame) ────────────
        List<PeriodoDto> audiometriasPorPeriodo = audiometrias.stream()
                .collect(Collectors.groupingBy(
                        a -> YearMonth.from(a.getDataExame()), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new PeriodoDto(e.getKey().format(PERIODO_FMT), e.getValue()))
                .toList();

        // ── distribuicaoGrauPerda (conta grauOd e grauOe; ignora null) ──────────
        Map<String, Long> grauContagem = new LinkedHashMap<>();
        for (Audiometria a : audiometrias) {
            if (a.getGrauOd() != null) grauContagem.merge(a.getGrauOd().name(), 1L, Long::sum);
            if (a.getGrauOe() != null) grauContagem.merge(a.getGrauOe().name(), 1L, Long::sum);
        }
        List<GrauPerdaDto> distribuicaoGrauPerda = grauContagem.entrySet().stream()
                .map(e -> new GrauPerdaDto(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(GrauPerdaDto::quantidade).reversed()
                        .thenComparing(GrauPerdaDto::classificacao))
                .toList();

        // ── escalasPorTipo (agrupa por questionário; quantidade + scoreMedio) ───
        List<EscalaTipoDto> escalasPorTipo = escalas.stream()
                .collect(Collectors.groupingBy(e -> e.getQuestionario().getId()))
                .values().stream()
                .map(list -> {
                    QuestionarioAplicado ref = list.get(0);
                    String codigo = ref.getQuestionario().getCodigo() != null
                            ? ref.getQuestionario().getCodigo().name() : null;
                    String nome = ref.getQuestionario().getNome();
                    BigDecimal scoreMedio = mediaInt(
                            list.stream().map(QuestionarioAplicado::getScoreTotal).toList(), 1);
                    return new EscalaTipoDto(codigo, nome, list.size(), scoreMedio);
                })
                .sorted(Comparator.comparingLong(EscalaTipoDto::quantidade).reversed()
                        .thenComparing(e -> e.nome() == null ? "" : e.nome()))
                .toList();

        // ── laudosPorTipo (agrupa por tipoExame) ────────────────────────────────
        List<LaudoTipoDto> laudosPorTipo = laudos.stream()
                .filter(l -> l.getTipoExame() != null)
                .collect(Collectors.groupingBy(l -> l.getTipoExame().name(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> new LaudoTipoDto(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(LaudoTipoDto::total).reversed()
                        .thenComparing(LaudoTipoDto::tipo))
                .toList();

        return new OtorrinoGeralDashboardDto(
                kpis,
                examesPorTipo,
                audiometriasPorPeriodo,
                distribuicaoGrauPerda,
                escalasPorTipo,
                laudosPorTipo);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    /** Média de uma lista de Integer (ignorando null), com a escala informada; 0 se vazia. */
    private BigDecimal mediaInt(List<Integer> valores, int scale) {
        List<Integer> validos = valores.stream().filter(Objects::nonNull).toList();
        if (validos.isEmpty()) return BigDecimal.ZERO.setScale(scale, RoundingMode.HALF_UP);
        long soma = validos.stream().mapToLong(Integer::longValue).sum();
        return BigDecimal.valueOf(soma)
                .divide(BigDecimal.valueOf(validos.size()), scale, RoundingMode.HALF_UP);
    }
}
