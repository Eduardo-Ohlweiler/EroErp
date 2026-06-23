package com.api.ero_erp.clinica.service;

import com.api.ero_erp.clinica.dtos.ContratarPacoteDto;
import com.api.ero_erp.clinica.dtos.PacoteContratadoResponseDto;
import com.api.ero_erp.clinica.dtos.SessaoResumoDto;
import com.api.ero_erp.clinica.dtos.SessaoSlotDto;
import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.clinica.entity.PacoteContratado;
import com.api.ero_erp.clinica.enums.StatusConsulta;
import com.api.ero_erp.clinica.enums.StatusPacote;
import com.api.ero_erp.clinica.repository.ConsultaRepository;
import com.api.ero_erp.clinica.repository.PacoteContratadoRepository;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.compromisso.entity.Compromisso;
import com.api.ero_erp.compromisso.repository.CompromissoRepository;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.emitente.service.EmitenteService;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.financeiro.contareceber.dtos.ContaReceberCreateDto;
import com.api.ero_erp.financeiro.contareceber.dtos.ContaReceberResponseDto;
import com.api.ero_erp.financeiro.contareceber.service.ContaReceberService;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.produto.entity.Produto;
import com.api.ero_erp.produto.repository.ProdutoRepository;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import com.api.ero_erp.whatsapp.service.WhatsappNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class PacoteContratadoService {

    private static final Logger log = LoggerFactory.getLogger(PacoteContratadoService.class);

    private final PacoteContratadoRepository  pacoteRepository;
    private final ConsultaRepository          consultaRepository;
    private final CompromissoRepository       compromissoRepository;
    private final ClienteService              clienteService;
    private final EmitenteService             emitenteService;
    private final PessoaService               pessoaService;
    private final UsuarioService              usuarioService;
    private final ProdutoRepository           produtoRepository;
    private final SecurityUtils               securityUtils;
    private final WhatsappNotificationService notificationService;
    private final ContaReceberService         contaReceberService;
    private final ConsultaService             consultaService;

    public PacoteContratadoService(
            PacoteContratadoRepository  pacoteRepository,
            ConsultaRepository          consultaRepository,
            CompromissoRepository       compromissoRepository,
            ClienteService              clienteService,
            EmitenteService             emitenteService,
            PessoaService               pessoaService,
            UsuarioService              usuarioService,
            ProdutoRepository           produtoRepository,
            SecurityUtils               securityUtils,
            WhatsappNotificationService notificationService,
            ContaReceberService         contaReceberService,
            ConsultaService             consultaService
    ) {
        this.pacoteRepository      = pacoteRepository;
        this.consultaRepository    = consultaRepository;
        this.compromissoRepository = compromissoRepository;
        this.clienteService        = clienteService;
        this.emitenteService       = emitenteService;
        this.pessoaService         = pessoaService;
        this.usuarioService        = usuarioService;
        this.produtoRepository     = produtoRepository;
        this.securityUtils         = securityUtils;
        this.notificationService   = notificationService;
        this.contaReceberService   = contaReceberService;
        this.consultaService       = consultaService;
    }

    // ── Leitura ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PacoteContratadoResponseDto findByIdResponse(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        PacoteContratado pacote = pacoteRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Pacote não encontrado, verifique!"));
        return buildResponse(pacote);
    }

    @Transactional(readOnly = true)
    public Page<PacoteContratadoResponseDto> getAll(
            Pageable pageable, Long pessoaId, StatusPacote status, String nome
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return pacoteRepository.findAllWithFilters(pageable, clienteId, pessoaId, status, nome)
                .map(this::buildResponse);
    }

    // ── Contratação ─────────────────────────────────────────────────────────────

    @Transactional
    public PacoteContratadoResponseDto contratar(ContratarPacoteDto dto) {
        Long     clienteId = securityUtils.getClienteIdLogado();
        Cliente  cliente   = clienteService.findById(clienteId);
        Usuario  usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());
        Emitente emitente  = emitenteService.findById(dto.emitenteId());
        Pessoa   pessoa    = pessoaService.findById(dto.pessoaId());
        Produto  produto   = produtoRepository.findByIdAndClienteId(dto.produtoId(), clienteId)
                .orElseThrow(() -> new NotFoundException("Serviço não encontrado, verifique!"));

        // 1. Validações de quantidade e slots
        if (dto.quantidadeSessoes() == null || dto.quantidadeSessoes() < 1)
            throw new BadRequestException("O pacote deve ter ao menos 1 sessão, verifique!");
        if (dto.sessoes().size() != dto.quantidadeSessoes())
            throw new BadRequestException(
                    "Informe exatamente " + dto.quantidadeSessoes() + " data(s) de sessão, verifique!");
        for (SessaoSlotDto slot : dto.sessoes()) {
            if (!slot.fim().isAfter(slot.inicio()))
                throw new BadRequestException("O horário de fim deve ser posterior ao de início, verifique!");
        }

        // 2. Validar conflito de TODOS os slots antes de criar qualquer coisa
        for (SessaoSlotDto slot : dto.sessoes()) {
            if (compromissoRepository.existsConflict(clienteId, slot.inicio(), slot.fim(), null))
                throw new ConflictException(
                        "Já existe um compromisso agendado neste horário: "
                                + slot.inicio().toLocalDate() + " " + slot.inicio().toLocalTime());
        }

        // 3. Criar o pacote (status ATIVO, sem conta a receber por ora)
        PacoteContratado pacote = new PacoteContratado();
        pacote.setCliente(cliente);
        pacote.setEmitente(emitente);
        pacote.setPessoa(pessoa);
        pacote.setProduto(produto);
        pacote.setNome(dto.nome().trim());
        pacote.setQuantidadeSessoes(dto.quantidadeSessoes());
        pacote.setValorTotal(dto.valorTotal());
        pacote.setObservacao(dto.observacao());
        pacote.setStatus(StatusPacote.ATIVO);
        pacote.setCreatedBy(usuario);
        pacoteRepository.save(pacote);

        // 4. Criar N compromissos + N consultas (sem linha de serviço por sessão)
        int                n            = dto.quantidadeSessoes();
        List<Consulta>     consultas    = new ArrayList<>();
        List<Compromisso>  compromissos = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            SessaoSlotDto slot = dto.sessoes().get(i);

            Compromisso compromisso = buildCompromisso(
                    pacote.getNome() + " - Sessão " + (i + 1) + "/" + n + " - " + pessoa.getNome(),
                    slot.inicio(), slot.fim(),
                    cliente, usuario, emitente, pessoa
            );
            compromissoRepository.save(compromisso);
            compromisso.setCompromissoPai(compromisso);
            compromissoRepository.save(compromisso);
            compromissos.add(compromisso);

            Consulta consulta = new Consulta();
            consulta.setCliente(cliente);
            consulta.setCompromisso(compromisso);
            consulta.setEmitente(emitente);
            consulta.setPessoa(pessoa);
            consulta.setStatus(StatusConsulta.AGENDADA);
            consulta.setInicio(compromisso.getInicio());
            consulta.setFim(compromisso.getFim());
            consulta.setPacote(pacote);
            consulta.setSessao(i + 1);
            consulta.setCreatedBy(usuario);
            consultaRepository.save(consulta);
            consultas.add(consulta);
        }

        // 5. Criar a conta a receber pré-paga única (reusa o fluxo do financeiro)
        ContaReceberCreateDto contaDto = new ContaReceberCreateDto(
                dto.emitenteId(),
                dto.pessoaId(),
                LocalDate.now().toString(),
                "Pacote: " + pacote.getNome(),
                dto.valorTotal(),
                null,
                dto.parcelas()
        );
        ContaReceberResponseDto conta = contaReceberService.create(contaDto);
        Long contaReceberId = conta.id();

        // 6. Propagar a conta a receber no pacote e em todas as consultas (faturado=true)
        pacote.setContaReceberId(contaReceberId);
        pacoteRepository.save(pacote);
        for (Consulta consulta : consultas) {
            consulta.setFaturado(true);
            consulta.setContaReceberId(contaReceberId);
            consultaRepository.save(consulta);
        }

        log.info("Pacote {} contratado para cliente {} com {} sessões (conta a receber {})",
                pacote.getId(), clienteId, n, contaReceberId);

        // 7. Notificar criação dos compromissos (best-effort)
        try {
            notificationService.notificarCriacaoRecorrente(compromissos);
        } catch (Exception e) {
            log.warn("Falha ao notificar criação do pacote {}: {}", pacote.getId(), e.getMessage());
        }

        return buildResponse(pacote);
    }

    // ── Cancelamento ──────────────────────────────────────────────────────────

    @Transactional
    public PacoteContratadoResponseDto cancelarPacote(Long id, String motivo) {
        Long             clienteId = securityUtils.getClienteIdLogado();
        Usuario          usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());
        PacoteContratado pacote    = pacoteRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Pacote não encontrado, verifique!"));

        if (pacote.getStatus() == StatusPacote.CANCELADO)
            throw new BadRequestException("Pacote já está cancelado, verifique!");

        List<Consulta> sessoes = consultaRepository
                .findByPacote_IdAndClienteIdOrderBySessaoAsc(id, clienteId);
        for (Consulta sessao : sessoes) {
            if (sessao.getStatus() == StatusConsulta.AGENDADA
                    || sessao.getStatus() == StatusConsulta.EM_ATENDIMENTO) {
                consultaService.cancelar(sessao.getId(), motivo);
            }
        }

        // Não toca na conta a receber (devolução/crédito é tratado manualmente)
        pacote.setStatus(StatusPacote.CANCELADO);
        pacote.setMotivoCancelamento(motivo);
        pacote.setUpdatedBy(usuario);
        pacoteRepository.save(pacote);

        log.info("Pacote {} cancelado pelo cliente {}", id, clienteId);
        return buildResponse(pacote);
    }

    @Transactional
    public PacoteContratadoResponseDto cancelarSessao(Long pacoteId, Long consultaId, String motivo) {
        Long             clienteId = securityUtils.getClienteIdLogado();
        PacoteContratado pacote    = pacoteRepository.findByIdAndClienteId(pacoteId, clienteId)
                .orElseThrow(() -> new NotFoundException("Pacote não encontrado, verifique!"));

        Consulta consulta = consultaRepository.findByIdAndClienteId(consultaId, clienteId)
                .orElseThrow(() -> new NotFoundException("Sessão não encontrada, verifique!"));
        if (consulta.getPacote() == null || !consulta.getPacote().getId().equals(pacoteId))
            throw new BadRequestException("A sessão não pertence a este pacote, verifique!");

        // Não toca na conta a receber (tratamento manual).
        consultaService.cancelar(consultaId, motivo);

        // buildResponse recalcula e persiste o status do pacote (auto-conclusão).
        return buildResponse(pacote);
    }

    // ── Auxiliares ────────────────────────────────────────────────────────────

    private PacoteContratadoResponseDto buildResponse(PacoteContratado pacote) {
        Long clienteId = securityUtils.getClienteIdLogado();
        List<Consulta> sessoes = consultaRepository
                .findByPacote_IdAndClienteIdOrderBySessaoAsc(pacote.getId(), clienteId);

        long concluidas = consultaRepository.countByPacote_IdAndStatus(pacote.getId(), StatusConsulta.CONCLUIDA);
        long canceladas = consultaRepository.countByPacote_IdAndStatus(pacote.getId(), StatusConsulta.CANCELADA);
        int  usadas     = (int) concluidas;
        int  restantes  = (int) (pacote.getQuantidadeSessoes() - concluidas - canceladas);
        if (restantes < 0) restantes = 0;

        // Auto-conclusão: todas as não-canceladas concluídas → CONCLUIDO
        long total         = pacote.getQuantidadeSessoes();
        long naoCanceladas = total - canceladas;
        if (pacote.getStatus() != StatusPacote.CANCELADO
                && naoCanceladas > 0 && concluidas == naoCanceladas
                && pacote.getStatus() != StatusPacote.CONCLUIDO) {
            pacote.setStatus(StatusPacote.CONCLUIDO);
            pacoteRepository.save(pacote);
        }

        List<SessaoResumoDto> sessoesDto = sessoes.stream()
                .map(c -> new SessaoResumoDto(
                        c.getId(), c.getSessao(), c.getStatus(), c.getInicio(), c.getFim()))
                .toList();

        Pessoa pessoa = pacote.getPessoa();

        return new PacoteContratadoResponseDto(
                pacote.getId(),
                pacote.getNome(),
                pacote.getStatus(),
                pacote.getEmitente().getId(),
                pacote.getEmitente().getPessoa().getNome(),
                pessoa.getId(),
                pessoa.getNome(),
                resolverDoc(pessoa),
                pacote.getProduto().getId(),
                pacote.getProduto().getNome(),
                pacote.getQuantidadeSessoes(),
                pacote.getValorTotal(),
                pacote.getContaReceberId(),
                pacote.getObservacao(),
                pacote.getMotivoCancelamento(),
                usadas,
                restantes,
                sessoesDto,
                pacote.getCreatedAt()
        );
    }

    private String resolverDoc(Pessoa p) {
        if (p == null) return null;
        if (p.getCpf() != null && !p.getCpf().isBlank()) return p.getCpf();
        return p.getCnpj();
    }

    private Compromisso buildCompromisso(
            String titulo, LocalDateTime inicio, LocalDateTime fim,
            Cliente cliente, Usuario usuario, Emitente emitente, Pessoa pessoa
    ) {
        Compromisso c = new Compromisso();
        c.setCliente(cliente);
        c.setUsuario(usuario);
        c.setEmitente(emitente);
        c.setPessoa(pessoa);
        c.setTitulo(titulo);
        c.setCor(emitente.getCor() != null ? emitente.getCor() : "#3a87ad");
        c.setInicio(inicio);
        c.setFim(fim);
        c.setCancelado(false);
        c.setConcluido(false);
        c.setRecorrenciaSimNao(false);
        c.setCreatedBy(usuario);
        return c;
    }
}
