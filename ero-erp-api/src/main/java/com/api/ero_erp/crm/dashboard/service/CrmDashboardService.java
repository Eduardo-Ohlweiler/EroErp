package com.api.ero_erp.crm.dashboard.service;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.crm.atendimento.entity.Atendimento;
import com.api.ero_erp.crm.atendimento.repository.AtendimentoRepository;
import com.api.ero_erp.crm.configuracaocrm.entity.ConfiguracaoCrm;
import com.api.ero_erp.crm.configuracaocrm.repository.ConfiguracaoCrmRepository;
import com.api.ero_erp.crm.dashboard.dtos.CrmDashboardDto;
import com.api.ero_erp.crm.dashboard.dtos.CrmDashboardDto.*;
import com.api.ero_erp.crm.dashboard.util.GeoBrasilUtils;
import com.api.ero_erp.endereco.repository.EnderecoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CrmDashboardService {

    private static final LocalDateTime     EPOCH           = LocalDateTime.of(1970, 1, 1, 0, 0);
    private static final String            SEM_LOCALIZACAO = "Sem localização";
    private static final String            SEM_RESPONSAVEL = "Sem responsável";
    private static final DateTimeFormatter DIA_FMT         = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter MES_FMT         = DateTimeFormatter.ofPattern("MM/yyyy");

    private final AtendimentoRepository     atendimentoRepository;
    private final ConfiguracaoCrmRepository configuracaoCrmRepository;
    private final EnderecoRepository        enderecoRepository;
    private final SecurityUtils             securityUtils;

    public CrmDashboardService(
            AtendimentoRepository     atendimentoRepository,
            ConfiguracaoCrmRepository configuracaoCrmRepository,
            EnderecoRepository        enderecoRepository,
            SecurityUtils             securityUtils
    ) {
        this.atendimentoRepository     = atendimentoRepository;
        this.configuracaoCrmRepository = configuracaoCrmRepository;
        this.enderecoRepository        = enderecoRepository;
        this.securityUtils             = securityUtils;
    }

    /** Linha achatada de atendimento já com UF/região resolvidas (labels prontos). */
    private record AtendimentoRow(
            Long          id,
            Long          usuarioId,
            String        usuarioNome,
            Long          andamentoId,
            String        andamentoNome,
            String        andamentoCor,
            String        andamentoChave,
            boolean       conclui,
            boolean       cancela,
            Long          pessoaId,
            String        numero,
            LocalDateTime dataAbertura,
            LocalDateTime dataConclusao,
            LocalDateTime dataUltimaMensagem,
            LocalDateTime dataUltimaMensagemCliente,
            boolean       ativo,
            int           mensagensNaoLidas,
            String        uf,
            String        regiao
    ) {
        boolean isAberto()     { return ativo && dataConclusao == null; }
        boolean isConcluido()  { return conclui; }
        boolean isCancelado()  { return cancela; }
        boolean isFinalizado() { return !ativo; }
    }

    @Transactional(readOnly = true)
    public CrmDashboardDto getDashboard(int dias, Long usuarioId, Long andamentoId, String uf) {
        Long clienteId = securityUtils.getClienteIdLogado();

        LocalDateTime dataInicio = dias > 0 ? LocalDateTime.now().minusDays(dias) : EPOCH;

        // UF por pessoa: endereço principal vence (ORDER BY principal DESC + putIfAbsent).
        Map<Long, String> ufPorPessoa = new HashMap<>();
        for (Object[] row : enderecoRepository.findCidadesPorPessoa(clienteId)) {
            Long pessoaId = (Long) row[0];
            String sigla  = (String) row[3];
            if (pessoaId != null) ufPorPessoa.putIfAbsent(pessoaId, sigla);
        }

        // Base: período + usuário + andamento aplicados na query; UF resolvida em Java.
        List<AtendimentoRow> todos = atendimentoRepository
                .listarParaDashboard(clienteId, dataInicio, usuarioId, andamentoId)
                .stream()
                .map(r -> toRow(r, ufPorPessoa))
                .toList();

        // Base para resumo/andamento/usuario/periodo: aplica TAMBÉM o filtro de UF.
        List<AtendimentoRow> filtrados = (uf == null || uf.isBlank())
                ? todos
                : todos.stream().filter(r -> uf.equalsIgnoreCase(r.uf())).toList();

        ResumoDto                  resumo       = montarResumo(filtrados);
        List<ContagemAndamentoDto> porAndamento = montarPorAndamento(filtrados);
        List<ContagemUsuarioDto>   porUsuario   = montarPorUsuario(filtrados);
        List<PontoPeriodoDto>      porPeriodo   = montarPorPeriodo(filtrados, dataInicio, dias);

        // Mapa geográfico: ignora o filtro de UF (mostra distribuição completa).
        List<ContagemUfDto> porUf = todos.stream()
                .collect(Collectors.groupingBy(AtendimentoRow::uf, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new ContagemUfDto(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(ContagemUfDto::quantidade).reversed())
                .toList();

        List<ContagemRegiaoDto> porRegiao = todos.stream()
                .collect(Collectors.groupingBy(AtendimentoRow::regiao, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new ContagemRegiaoDto(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(ContagemRegiaoDto::quantidade).reversed())
                .toList();

        // Pendências: estado atual, só quando ativadas no tenant.
        ConfiguracaoCrm config = configuracaoCrmRepository.findByClienteId(clienteId).orElse(null);
        boolean pendenciasAtivas = config != null && Boolean.TRUE.equals(config.getAtivarPendencias());
        PendenciasDto pendencias = pendenciasAtivas ? montarPendencias(clienteId) : null;

        return new CrmDashboardDto(
                resumo, porAndamento, porUsuario, porPeriodo, porUf, porRegiao,
                pendenciasAtivas, pendencias
        );
    }

    // ── Mapeamento Object[] → AtendimentoRow ──────────────────────────────────

    private AtendimentoRow toRow(Object[] r, Map<Long, String> ufPorPessoa) {
        Long          id                        = (Long) r[0];
        Long          usuarioId                 = (Long) r[1];
        String        usuarioNome               = (String) r[2];
        Long          andamentoId               = (Long) r[3];
        String        andamentoNome             = (String) r[4];
        String        andamentoCor              = (String) r[5];
        String        andamentoChave            = (String) r[6];
        boolean       conclui                   = Boolean.TRUE.equals(r[7]);
        boolean       cancela                   = Boolean.TRUE.equals(r[8]);
        Long          pessoaId                  = (Long) r[9];
        String        numero                    = (String) r[10];
        LocalDateTime dataAbertura              = (LocalDateTime) r[11];
        LocalDateTime dataConclusao             = (LocalDateTime) r[12];
        LocalDateTime dataUltimaMensagem        = (LocalDateTime) r[13];
        LocalDateTime dataUltimaMensagemCliente = (LocalDateTime) r[14];
        boolean       ativo                     = Boolean.TRUE.equals(r[15]);
        int           mensagensNaoLidas         = r[16] != null ? ((Number) r[16]).intValue() : 0;

        String uf = null;
        if (pessoaId != null) uf = ufPorPessoa.get(pessoaId);
        if (uf == null)       uf = GeoBrasilUtils.dddParaUf(numero);

        String ufLabel     = uf != null ? uf : SEM_LOCALIZACAO;
        String regiao      = GeoBrasilUtils.ufParaRegiao(uf);
        String regiaoLabel = regiao != null ? regiao : SEM_LOCALIZACAO;

        return new AtendimentoRow(
                id, usuarioId, usuarioNome, andamentoId, andamentoNome, andamentoCor, andamentoChave,
                conclui, cancela, pessoaId, numero,
                dataAbertura, dataConclusao, dataUltimaMensagem, dataUltimaMensagemCliente,
                ativo, mensagensNaoLidas, ufLabel, regiaoLabel
        );
    }

    // ── Resumo (KPIs) ─────────────────────────────────────────────────────────

    private ResumoDto montarResumo(List<AtendimentoRow> rows) {
        long total          = rows.size();
        long abertos        = rows.stream().filter(AtendimentoRow::isAberto).count();
        long concluidos     = rows.stream().filter(AtendimentoRow::isConcluido).count();
        long cancelados     = rows.stream().filter(AtendimentoRow::isCancelado).count();
        long semResponsavel = rows.stream().filter(r -> r.usuarioId() == null).count();
        long msgNaoLidas    = rows.stream().mapToLong(AtendimentoRow::mensagensNaoLidas).sum();
        long finalizados    = rows.stream().filter(AtendimentoRow::isFinalizado).count();

        List<Long> conclusaoMin = new ArrayList<>();
        List<Long> respostaMin  = new ArrayList<>();
        for (AtendimentoRow r : rows) {
            if (r.isConcluido() && r.dataAbertura() != null && r.dataConclusao() != null
                    && !r.dataConclusao().isBefore(r.dataAbertura())) {
                conclusaoMin.add(Duration.between(r.dataAbertura(), r.dataConclusao()).toMinutes());
            }
            if (r.dataUltimaMensagem() != null && r.dataUltimaMensagemCliente() != null
                    && r.dataUltimaMensagem().isAfter(r.dataUltimaMensagemCliente())) {
                respostaMin.add(Duration.between(r.dataUltimaMensagemCliente(), r.dataUltimaMensagem()).toMinutes());
            }
        }

        double taxaConclusao = finalizados > 0 ? (double) concluidos / finalizados : 0.0;

        return new ResumoDto(
                total, abertos, concluidos, cancelados, semResponsavel, msgNaoLidas,
                mediaHoras(conclusaoMin), mediaHoras(respostaMin), round(taxaConclusao, 4)
        );
    }

    // ── Distribuições ─────────────────────────────────────────────────────────

    private List<ContagemAndamentoDto> montarPorAndamento(List<AtendimentoRow> rows) {
        return rows.stream()
                .collect(Collectors.groupingBy(AtendimentoRow::andamentoId))
                .values().stream()
                .map(grupo -> {
                    AtendimentoRow ref = grupo.get(0);
                    return new ContagemAndamentoDto(
                            ref.andamentoId(), ref.andamentoNome(), ref.andamentoCor(),
                            ref.andamentoChave(), grupo.size());
                })
                .sorted(Comparator.comparingLong(ContagemAndamentoDto::quantidade).reversed())
                .toList();
    }

    private List<ContagemUsuarioDto> montarPorUsuario(List<AtendimentoRow> rows) {
        // Agrupamento manual: usuarioId nulo não é permitido em Collectors.groupingBy.
        Map<Long, List<AtendimentoRow>> porUsuario = new LinkedHashMap<>();
        for (AtendimentoRow r : rows) {
            porUsuario.computeIfAbsent(r.usuarioId(), k -> new ArrayList<>()).add(r);
        }
        return porUsuario.entrySet().stream()
                .map(e -> {
                    Long   uid   = e.getKey();
                    List<AtendimentoRow> grupo = e.getValue();
                    String nome  = uid == null ? SEM_RESPONSAVEL : grupo.get(0).usuarioNome();
                    long   abertos    = grupo.stream().filter(AtendimentoRow::isAberto).count();
                    long   concluidos = grupo.stream().filter(AtendimentoRow::isConcluido).count();
                    long   cancelados = grupo.stream().filter(AtendimentoRow::isCancelado).count();
                    return new ContagemUsuarioDto(uid, nome, grupo.size(), abertos, concluidos, cancelados);
                })
                .sorted(Comparator.comparingLong(ContagemUsuarioDto::total).reversed())
                .toList();
    }

    /**
     * Série temporal por dataAbertura (abertos) e dataConclusao (concluídos).
     * Bucket por dia quando {@code dias} está entre 1 e 31; caso contrário por mês
     * (janela limitada aos últimos 12 meses para evitar séries gigantes com dias==0).
     */
    private List<PontoPeriodoDto> montarPorPeriodo(List<AtendimentoRow> rows, LocalDateTime dataInicio, int dias) {
        boolean porDia = dias > 0 && dias <= 31;
        List<PontoPeriodoDto> pontos = new ArrayList<>();

        if (porDia) {
            Map<LocalDate, Long> aberturas = rows.stream()
                    .filter(r -> r.dataAbertura() != null)
                    .collect(Collectors.groupingBy(r -> r.dataAbertura().toLocalDate(), Collectors.counting()));
            Map<LocalDate, Long> conclusoes = rows.stream()
                    .filter(r -> r.dataConclusao() != null)
                    .collect(Collectors.groupingBy(r -> r.dataConclusao().toLocalDate(), Collectors.counting()));

            LocalDate hoje   = LocalDate.now();
            for (LocalDate d = dataInicio.toLocalDate(); !d.isAfter(hoje); d = d.plusDays(1)) {
                pontos.add(new PontoPeriodoDto(
                        d.format(DIA_FMT),
                        aberturas.getOrDefault(d, 0L),
                        conclusoes.getOrDefault(d, 0L)));
            }
        } else {
            Map<YearMonth, Long> aberturas = rows.stream()
                    .filter(r -> r.dataAbertura() != null)
                    .collect(Collectors.groupingBy(r -> YearMonth.from(r.dataAbertura()), Collectors.counting()));
            Map<YearMonth, Long> conclusoes = rows.stream()
                    .filter(r -> r.dataConclusao() != null)
                    .collect(Collectors.groupingBy(r -> YearMonth.from(r.dataConclusao()), Collectors.counting()));

            YearMonth mesAtual = YearMonth.now();
            YearMonth limite   = mesAtual.minusMonths(11);
            YearMonth desdeMes = YearMonth.from(dataInicio);
            YearMonth inicio   = desdeMes.isAfter(limite) ? desdeMes : limite;
            for (YearMonth ym = inicio; !ym.isAfter(mesAtual); ym = ym.plusMonths(1)) {
                pontos.add(new PontoPeriodoDto(
                        ym.format(MES_FMT),
                        aberturas.getOrDefault(ym, 0L),
                        conclusoes.getOrDefault(ym, 0L)));
            }
        }
        return pontos;
    }

    // ── Pendências (estado atual, sem filtro de período/UF) ───────────────────

    private PendenciasDto montarPendencias(Long clienteId) {
        List<Atendimento> pendentes = atendimentoRepository.findAbertosComRespostaCliente(clienteId);

        Map<Long, List<Atendimento>> porUsuario = new LinkedHashMap<>();
        for (Atendimento a : pendentes) {
            Long uid = a.getUsuario() != null ? a.getUsuario().getId() : null;
            porUsuario.computeIfAbsent(uid, k -> new ArrayList<>()).add(a);
        }
        List<PendenciaUsuarioDto> pendPorUsuario = porUsuario.entrySet().stream()
                .map(e -> {
                    Long   uid  = e.getKey();
                    String nome = uid == null ? SEM_RESPONSAVEL : e.getValue().get(0).getUsuario().getNome();
                    return new PendenciaUsuarioDto(uid, nome, e.getValue().size());
                })
                .sorted(Comparator.comparingLong(PendenciaUsuarioDto::quantidade).reversed())
                .toList();

        long f0_24 = 0, f24_48 = 0, f48_72 = 0, f72 = 0;
        LocalDateTime agora = LocalDateTime.now();
        for (Atendimento a : pendentes) {
            LocalDateTime ref = a.getDataUltimaMensagemCliente();
            long horas = ref != null ? Duration.between(ref, agora).toHours() : 0;
            if      (horas < 24) f0_24++;
            else if (horas < 48) f24_48++;
            else if (horas < 72) f48_72++;
            else                 f72++;
        }
        List<PendenciaFaixaDto> porFaixa = List.of(
                new PendenciaFaixaDto("0-24h",  f0_24),
                new PendenciaFaixaDto("24-48h", f24_48),
                new PendenciaFaixaDto("48-72h", f48_72),
                new PendenciaFaixaDto(">72h",   f72)
        );

        return new PendenciasDto(pendentes.size(), pendPorUsuario, porFaixa);
    }

    // ── Helpers numéricos ─────────────────────────────────────────────────────

    /** Média de uma lista de durações (em minutos) convertida para horas; null se vazia. */
    private Double mediaHoras(List<Long> minutos) {
        if (minutos.isEmpty()) return null;
        double mediaMin = minutos.stream().mapToLong(Long::longValue).average().orElse(0);
        return round(mediaMin / 60.0, 2);
    }

    private double round(double valor, int casas) {
        double fator = Math.pow(10, casas);
        return Math.round(valor * fator) / fator;
    }
}
