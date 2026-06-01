package com.api.ero_erp.compromisso.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.compromisso.dtos.CompromissoCalendarioDto;
import com.api.ero_erp.compromisso.dtos.CompromissoCreateDto;
import com.api.ero_erp.compromisso.dtos.CompromissoResponseDto;
import com.api.ero_erp.compromisso.dtos.CompromissoUpdateDto;
import com.api.ero_erp.compromisso.entity.Compromisso;
import com.api.ero_erp.compromisso.enums.TipoRecorrencia;
import com.api.ero_erp.compromisso.mapper.CompromissoMapper;
import com.api.ero_erp.compromisso.repository.CompromissoRepository;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.emitente.service.EmitenteService;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.compromisso.dtos.CompromissoDashboardDto;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import com.api.ero_erp.whatsapp.service.WhatsappNotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CompromissoService {

    private final CompromissoRepository       compromissoRepository;
    private final ClienteService              clienteService;
    private final EmitenteService             emitenteService;
    private final UsuarioService              usuarioService;
    private final PessoaService               pessoaService;
    private final SecurityUtils               securityUtils;
    private final WhatsappNotificationService notificationService;

    public CompromissoService(
            CompromissoRepository       compromissoRepository,
            ClienteService              clienteService,
            EmitenteService             emitenteService,
            UsuarioService              usuarioService,
            PessoaService               pessoaService,
            SecurityUtils               securityUtils,
            WhatsappNotificationService notificationService
    ) {
        this.compromissoRepository = compromissoRepository;
        this.clienteService        = clienteService;
        this.emitenteService       = emitenteService;
        this.usuarioService        = usuarioService;
        this.pessoaService         = pessoaService;
        this.securityUtils         = securityUtils;
        this.notificationService   = notificationService;
    }

    @Transactional(readOnly = true)
    public Compromisso findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return compromissoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Compromisso não encontrado"));
    }

    @Transactional(readOnly = true)
    public CompromissoResponseDto findByIdResponse(Long id) {
        return CompromissoMapper.toDto(findById(id));
    }

    @Transactional(readOnly = true)
    public Page<CompromissoResponseDto> getAll(
            Pageable      pageable,
            String        titulo,
            Long          emitente_id,
            Long          pessoaId,
            Long          usuarioId,
            Boolean       cancelado,
            Boolean       concluido,
            LocalDateTime inicio,
            LocalDateTime fim
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return compromissoRepository
                .findAllWithFilters(pageable, clienteId, titulo,  emitente_id,
                        pessoaId, usuarioId, cancelado, concluido, inicio, fim)
                .map(CompromissoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<CompromissoCalendarioDto> getCalendario(LocalDateTime inicio, LocalDateTime fim) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return compromissoRepository.findByPeriodo(clienteId, inicio, fim)
                .stream()
                .map(CompromissoMapper::toCalendarioDto)
                .toList();
    }

    @Transactional
    public List<CompromissoResponseDto> create(CompromissoCreateDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = clienteService.findById(clienteId);
        Usuario usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        validarHorario(dto.inicio(), dto.fim());
        validarConflito(clienteId, dto.inicio(), dto.fim(), null);

        boolean temRecorrencia = Boolean.TRUE.equals(dto.recorrenciaSimNao());
        if (temRecorrencia)
            validarRecorrencia(dto.tipoRecorrencia(), dto.quantidadeRecorrencia());

        Pessoa pessoa     = resolverPessoa(dto.pessoaId());
        Emitente emitente = resolverEmitente(dto.emitenteId());

        Compromisso pai = buildCompromisso(
                dto.titulo(), dto.descricao(), dto.cor(),
                dto.inicio(), dto.fim(),
                cliente, usuario, emitente, pessoa,
                temRecorrencia,
                temRecorrencia ? dto.tipoRecorrencia()       : null,
                temRecorrencia ? dto.quantidadeRecorrencia() : null,
                null
        );
        compromissoRepository.save(pai);

        pai.setCompromissoPai(pai);
        compromissoRepository.save(pai);

        notificationService.notificarCriacao(pai);

        List<CompromissoResponseDto> result = new ArrayList<>();
        result.add(CompromissoMapper.toDto(pai));

        if (temRecorrencia
                && dto.quantidadeRecorrencia() != null
                && dto.quantidadeRecorrencia() > 1) {

            LocalDateTime inicioRec = dto.inicio();
            LocalDateTime fimRec    = dto.fim();

            for (int i = 1; i < dto.quantidadeRecorrencia(); i++) {
                inicioRec = proximaOcorrencia(inicioRec, dto.tipoRecorrencia());
                fimRec    = proximaOcorrencia(fimRec,    dto.tipoRecorrencia());

                inicioRec = ajustaSeDomingo(inicioRec);
                fimRec    = ajustaSeDomingo(fimRec);

                validarConflito(clienteId, inicioRec, fimRec, null);

                Compromisso filho = buildCompromisso(
                        dto.titulo(), dto.descricao(), dto.cor(),
                        inicioRec, fimRec,
                        cliente, usuario, emitente, pessoa,
                        true,
                        dto.tipoRecorrencia(),
                        dto.quantidadeRecorrencia(),
                        pai
                );
                compromissoRepository.save(filho);
                notificationService.notificarCriacao(filho);
                result.add(CompromissoMapper.toDto(filho));
            }
        }

        return result;
    }

    @Transactional
    public CompromissoResponseDto update(Long id, CompromissoUpdateDto dto) {
        Long        clienteId   = securityUtils.getClienteIdLogado();
        Compromisso compromisso = findById(id);
        Usuario     usuario     = usuarioService.findById(securityUtils.getUsuarioIdLogado());
        Emitente emitente       = resolverEmitente(dto.emitenteId());

        if (Boolean.TRUE.equals(compromisso.getCancelado()))
            throw new BadRequestException("Não é possível editar um compromisso cancelado");
        if (Boolean.TRUE.equals(compromisso.getConcluido()))
            throw new BadRequestException("Não é possível editar um compromisso já concluído");

        validarHorario(dto.inicio(), dto.fim());
        validarConflito(clienteId, dto.inicio(), dto.fim(), id);

        Pessoa pessoa = resolverPessoa(dto.pessoaId());

        compromisso.setTitulo(dto.titulo());
        compromisso.setDescricao(dto.descricao());
        compromisso.setCor(dto.cor() != null ? dto.cor() : "#3a87ad");
        compromisso.setInicio(dto.inicio());
        compromisso.setFim(dto.fim());
        compromisso.setEmitente(emitente);
        compromisso.setPessoa(pessoa);
        compromisso.setUpdatedBy(usuario);
        return CompromissoMapper.toDto(compromissoRepository.save(compromisso));
    }

    @Transactional
    public CompromissoResponseDto cancelar(Long id, String motivo) {
        Compromisso compromisso = findById(id);
        Usuario     usuario     = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (Boolean.TRUE.equals(compromisso.getConcluido()))
            throw new BadRequestException("Não é possível cancelar um compromisso já concluído");
        if (Boolean.TRUE.equals(compromisso.getCancelado()))
            throw new BadRequestException("Compromisso já está cancelado");

        compromisso.setCancelado(true);
        compromisso.setMotivoCancelamento(motivo);
        compromisso.setUpdatedBy(usuario);

        Compromisso salvo = compromissoRepository.save(compromisso);
        notificationService.notificarCancelamento(salvo);
        return CompromissoMapper.toDto(salvo);
    }

    @Transactional
    public CompromissoResponseDto concluir(Long id) {
        Compromisso compromisso = findById(id);
        Usuario     usuario     = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (Boolean.TRUE.equals(compromisso.getCancelado()))
            throw new BadRequestException("Não é possível concluir um compromisso cancelado");
        if (Boolean.TRUE.equals(compromisso.getConcluido()))
            throw new BadRequestException("Compromisso já está concluído");

        compromisso.setConcluido(true);
        compromisso.setUpdatedBy(usuario);

        Compromisso salvo = compromissoRepository.save(compromisso);
        notificationService.notificarConclusao(salvo);
        return CompromissoMapper.toDto(salvo);
    }

    @Transactional
    public void delete(Long id) {
        Compromisso compromisso = findById(id);

        boolean isPai = compromisso.getCompromissoPai() != null
                && compromisso.getCompromissoPai().getId().equals(compromisso.getId());

        if (isPai) {
            // Deleta todos os filhos antes de remover o pai
            compromissoRepository
                    .findByCompromissoPaiIdOrderByInicio(id)
                    .stream()
                    .filter(f -> !f.getId().equals(id))
                    .forEach(f -> {
                        f.setCompromissoPai(null); // quebra FK antes de deletar
                        compromissoRepository.delete(f);
                    });

            compromisso.setCompromissoPai(null);
            compromissoRepository.save(compromisso);
        }

        compromissoRepository.delete(compromisso);
    }

    @Transactional(readOnly = true)
    public CompromissoDashboardDto getDashboard() {
        Long          clienteId  = securityUtils.getClienteIdLogado();
        LocalDateTime agora      = LocalDateTime.now();
        LocalDateTime inicioDia  = agora.toLocalDate().atStartOfDay();
        LocalDateTime fimDia     = inicioDia.plusDays(1);
        LocalDateTime inicioSemana = inicioDia.with(DayOfWeek.MONDAY);
        LocalDateTime fimSemana    = inicioSemana.plusDays(7);

        // ── KPIs ──────────────────────────────────────────────────────────────
        long totalAgendados  = compromissoRepository.countByClienteIdAndCanceladoFalseAndConcluidoFalse(clienteId);
        long totalCancelados = compromissoRepository.countByClienteIdAndCanceladoTrue(clienteId);
        long totalConcluidos = compromissoRepository.countByClienteIdAndConcluidoTrue(clienteId);
        long totalHoje       = compromissoRepository.countNoPeriodo(clienteId, inicioDia, fimDia);
        long totalSemana     = compromissoRepository.countNoPeriodo(clienteId, inicioSemana, fimSemana);

        // ── Próximos hoje ─────────────────────────────────────────────────────
        DateTimeFormatter fmtHora = DateTimeFormatter.ofPattern("HH:mm");

        List<CompromissoDashboardDto.ProximoDto> proximosHoje = compromissoRepository
                .findProximosHoje(clienteId, agora, fimDia)
                .stream()
                .limit(8)
                .map(c -> new CompromissoDashboardDto.ProximoDto(
                        c.getId(),
                        c.getTitulo(),
                        c.getInicio().format(fmtHora),
                        c.getFim()   .format(fmtHora),
                        c.getPessoa() != null ? c.getPessoa().getNome() : null
                ))
                .toList();

        // ── Top 5 pessoas ─────────────────────────────────────────────────────
        List<CompromissoDashboardDto.PorPessoaDto> topPessoas = compromissoRepository
                .findTopPessoas(clienteId, PageRequest.of(0, 5))
                .stream()
                .map(row -> new CompromissoDashboardDto.PorPessoaDto(
                        (String) row[0],
                        ((Number) row[1]).longValue()
                ))
                .toList();

        // ── Últimos 7 dias ────────────────────────────────────────────────────
        LocalDateTime seteDiasAtras = inicioDia.minusDays(6);
        List<LocalDateTime> inicios7dias = compromissoRepository
                .findIniciosNoPeriodo(clienteId, seteDiasAtras, fimDia);

        Map<LocalDate, Long> contPorDia = inicios7dias.stream()
                .collect(Collectors.groupingBy(LocalDateTime::toLocalDate, Collectors.counting()));

        List<CompromissoDashboardDto.PorDiaDto> ultimosSeteDias = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate dia   = agora.toLocalDate().minusDays(i);
            String diaSemana = dia.getDayOfWeek()
                    .getDisplayName(TextStyle.SHORT, new Locale("pt", "BR"));
            ultimosSeteDias.add(new CompromissoDashboardDto.PorDiaDto(
                    capitalizar(diaSemana),
                    dia.format(DateTimeFormatter.ofPattern("dd/MM")),
                    contPorDia.getOrDefault(dia, 0L)
            ));
        }

        // ── Distribuição por horário (últimos 30 dias) ────────────────────────
        List<LocalDateTime> inicios30dias = compromissoRepository
                .findIniciosNoPeriodo(clienteId, agora.minusDays(30), fimDia);

        Map<Integer, Long> contPorHora = inicios30dias.stream()
                .collect(Collectors.groupingBy(
                        dt -> dt.getHour(),
                        LinkedHashMap::new,
                        Collectors.counting()
                ));

        List<CompromissoDashboardDto.PorHoraDto> distribuicaoHorario = contPorHora.entrySet()
                .stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new CompromissoDashboardDto.PorHoraDto(e.getKey(), e.getValue()))
                .toList();

        return new CompromissoDashboardDto(
                totalAgendados, totalCancelados, totalConcluidos,
                totalHoje, totalSemana,
                proximosHoje, topPessoas, ultimosSeteDias, distribuicaoHorario
        );
    }

    private static String capitalizar(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private Compromisso buildCompromisso(
            String          titulo,
            String          descricao,
            String          cor,
            LocalDateTime   inicio,
            LocalDateTime   fim,
            Cliente         cliente,
            Usuario         usuario,
            Emitente        emitente,
            Pessoa          pessoa,
            boolean         recorrenciaSimNao,
            TipoRecorrencia tipoRecorrencia,
            Integer         quantidadeRecorrencia,
            Compromisso     pai
    ) {
        Compromisso c = new Compromisso();
        c.setCliente(cliente);
        c.setUsuario(usuario);
        c.setEmitente(emitente);
        c.setPessoa(pessoa);
        c.setTitulo(titulo);
        c.setDescricao(descricao);
        c.setCor(cor != null ? cor : "#3a87ad");
        c.setInicio(inicio);
        c.setFim(fim);
        c.setCancelado(false);
        c.setConcluido(false);
        c.setRecorrenciaSimNao(recorrenciaSimNao);
        c.setTipoRecorrencia(tipoRecorrencia);
        c.setQuantidadeRecorrencia(quantidadeRecorrencia);
        c.setCompromissoPai(pai);
        c.setCreatedBy(usuario);
        return c;
    }

    private Pessoa resolverPessoa(Long pessoaId) {
        if (pessoaId == null)
            return null;
        return pessoaService.findById(pessoaId);
    }

    private Emitente resolverEmitente(Long emitenteId) {
        if (emitenteId == null)
            return null;
        return emitenteService.findById(emitenteId);
    }

    private void validarHorario(LocalDateTime inicio, LocalDateTime fim) {
        if (!fim.isAfter(inicio))
            throw new BadRequestException("O horário de fim deve ser posterior ao de início");
    }

    private void validarConflito(Long clienteId, LocalDateTime inicio, LocalDateTime fim, Long excludeId) {
        if (compromissoRepository.existsConflict(clienteId, inicio, fim, excludeId))
            throw new ConflictException(
                    "Já existe um compromisso agendado neste horário: "
                            + inicio.toLocalDate() + " " + inicio.toLocalTime()
            );
    }

    private void validarRecorrencia(TipoRecorrencia tipo, Integer quantidade) {
        if (tipo == null)
            throw new BadRequestException("Informe o tipo de recorrência");
        if (quantidade == null || quantidade < 2)
            throw new BadRequestException(
                    "Para compromissos recorrentes, informe a quantidade (mínimo 2)");
    }

    private LocalDateTime proximaOcorrencia(LocalDateTime base, TipoRecorrencia tipo) {
        return switch (tipo) {
            case DIARIO     -> base.plusDays(1);
            case SEMANAL    -> base.plusWeeks(1);
            case QUINZENAL  -> base.plusDays(15);
            case MENSAL     -> addMonthSafe(base);
            case TRIMESTRAL -> addMonthSafeN(base, 3);
            case SEMESTRAL  -> addMonthSafeN(base, 6);
            case ANUAL      -> base.plusYears(1);
        };
    }

    private LocalDateTime addMonthSafe(LocalDateTime base) {
        LocalDate date   = base.toLocalDate();
        int       day    = date.getDayOfMonth();
        LocalDate next   = date.withDayOfMonth(1).plusMonths(1);
        int       maxDay = next.lengthOfMonth();
        return next.withDayOfMonth(Math.min(day, maxDay)).atTime(base.toLocalTime());
    }

    private LocalDateTime addMonthSafeN(LocalDateTime base, int months) {
        LocalDateTime result = base;
        for (int i = 0; i < months; i++) result = addMonthSafe(result);
        return result;
    }

    private LocalDateTime ajustaSeDomingo(LocalDateTime dt) {
        if (dt.getDayOfWeek().getValue() == 7)
            return dt.plusDays(1);
        return dt;
    }
}
