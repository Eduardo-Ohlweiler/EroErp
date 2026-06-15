package com.api.ero_erp.clinica.service;

import com.api.ero_erp.clinica.dtos.*;
import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.clinica.entity.ConsultaProduto;
import com.api.ero_erp.clinica.entity.ConsultaServico;
import com.api.ero_erp.clinica.entity.FichaAnamnese;
import com.api.ero_erp.clinica.enums.StatusConsulta;
import com.api.ero_erp.clinica.mapper.ConsultaMapper;
import com.api.ero_erp.clinica.repository.ConsultaProdutoRepository;
import com.api.ero_erp.clinica.repository.ConsultaRepository;
import com.api.ero_erp.clinica.repository.ConsultaServicoRepository;
import com.api.ero_erp.clinica.repository.FichaAnamneseRepository;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.compromisso.entity.Compromisso;
import com.api.ero_erp.compromisso.repository.CompromissoRepository;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.emitente.service.EmitenteService;
import com.api.ero_erp.estoque.service.EstoqueService;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ConsultaService {

    private static final Logger log = LoggerFactory.getLogger(ConsultaService.class);

    private final ConsultaRepository          consultaRepository;
    private final ConsultaServicoRepository   servicoRepository;
    private final ConsultaProdutoRepository   produtoConsumidoRepository;
    private final CompromissoRepository       compromissoRepository;
    private final ClienteService              clienteService;
    private final EmitenteService             emitenteService;
    private final PessoaService               pessoaService;
    private final UsuarioService              usuarioService;
    private final ProdutoRepository           produtoRepository;
    private final EstoqueService              estoqueService;
    private final SecurityUtils               securityUtils;
    private final WhatsappNotificationService notificationService;
    private final FichaAnamneseRepository     fichaAnamneseRepository;

    public ConsultaService(
            ConsultaRepository          consultaRepository,
            ConsultaServicoRepository   servicoRepository,
            ConsultaProdutoRepository   produtoConsumidoRepository,
            CompromissoRepository       compromissoRepository,
            ClienteService              clienteService,
            EmitenteService             emitenteService,
            PessoaService               pessoaService,
            UsuarioService              usuarioService,
            ProdutoRepository           produtoRepository,
            EstoqueService              estoqueService,
            SecurityUtils               securityUtils,
            WhatsappNotificationService notificationService,
            FichaAnamneseRepository     fichaAnamneseRepository
    ) {
        this.consultaRepository         = consultaRepository;
        this.servicoRepository          = servicoRepository;
        this.produtoConsumidoRepository = produtoConsumidoRepository;
        this.compromissoRepository      = compromissoRepository;
        this.clienteService             = clienteService;
        this.emitenteService            = emitenteService;
        this.pessoaService              = pessoaService;
        this.usuarioService             = usuarioService;
        this.produtoRepository          = produtoRepository;
        this.estoqueService             = estoqueService;
        this.securityUtils              = securityUtils;
        this.notificationService        = notificationService;
        this.fichaAnamneseRepository    = fichaAnamneseRepository;
    }

    // ── Consultas ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Consulta findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return consultaRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Consulta não encontrada"));
    }

    @Transactional(readOnly = true)
    public ConsultaResponseDto findByIdResponse(Long id) {
        Consulta consulta = findById(id);
        return buildResponse(consulta);
    }

    @Transactional(readOnly = true)
    public Page<ConsultaResponseDto> getAll(
            Pageable       pageable,
            StatusConsulta status,
            Long           emitenteId,
            Long           pessoaId,
            LocalDateTime  inicio,
            LocalDateTime  fim,
            String         nomePessoa
    ) {
        Long          clienteId   = securityUtils.getClienteIdLogado();
        LocalDateTime inicioFinal = (inicio != null) ? inicio : LocalDateTime.of(1900, 1, 1, 0, 0);
        LocalDateTime fimFinal    = (fim    != null) ? fim    : LocalDateTime.of(2100, 12, 31, 23, 59, 59);
        return consultaRepository.findAllWithFilters(
                pageable, clienteId, status, emitenteId, pessoaId, inicioFinal, fimFinal, nomePessoa
        ).map(this::buildResponse);
    }

    @Transactional(readOnly = true)
    public List<CompromissoDisponivelDto> listarCompromissosDisponiveis() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return consultaRepository.findCompromissosDisponiveis(clienteId, LocalDateTime.now())
                .stream()
                .map(this::toCompromissoDisponivelDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CompromissoDisponivelDto buscarCompromissoDisponivel(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        Compromisso c = compromissoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Compromisso não encontrado"));
        return toCompromissoDisponivelDto(c);
    }

    private CompromissoDisponivelDto toCompromissoDisponivelDto(Compromisso c) {
        Pessoa p         = c.getPessoa();
        String nome      = p != null ? p.getNome() : null;
        String documento = p == null ? null : (p.getCpf() != null ? p.getCpf() : p.getCnpj());
        return new CompromissoDisponivelDto(
                c.getId(),
                c.getTitulo(),
                c.getInicio(),
                c.getFim(),
                nome,
                documento
        );
    }

    @Transactional
    public ConsultaResponseDto create(ConsultaCreateDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = clienteService.findById(clienteId);
        Usuario usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());
        Emitente emitente = emitenteService.findById(dto.emitenteId());
        Pessoa   pessoa   = pessoaService.findById(dto.pessoaId());

        Compromisso compromisso;

        if (dto.compromissoId() != null) {
            // Vincula a um compromisso já existente na agenda
            compromisso = compromissoRepository.findByIdAndClienteId(dto.compromissoId(), clienteId)
                    .orElseThrow(() -> new NotFoundException("Compromisso não encontrado"));

            if (Boolean.TRUE.equals(compromisso.getCancelado()))
                throw new BadRequestException("Não é possível vincular um compromisso cancelado");
            if (Boolean.TRUE.equals(compromisso.getConcluido()))
                throw new BadRequestException("Não é possível vincular um compromisso concluído");
            if (consultaRepository.existsByCompromissoId(compromisso.getId()))
                throw new BadRequestException("Compromisso já está vinculado a uma consulta");

            // Padroniza o compromisso para consulta (mesmo comportamento do update)
            compromisso.setTitulo("Consulta - " + pessoa.getNome());
            compromisso.setEmitente(emitente);
            compromisso.setPessoa(pessoa);
            compromisso.setUpdatedBy(usuario);
            if (compromisso.getCompromissoPai() == null)
                compromisso.setCompromissoPai(compromisso);
            compromissoRepository.save(compromisso);
        } else {
            // Cria o compromisso na agenda automaticamente
            if (dto.inicio() == null || dto.fim() == null)
                throw new BadRequestException("Início e fim são obrigatórios");
            if (!dto.fim().isAfter(dto.inicio()))
                throw new BadRequestException("O horário de fim deve ser posterior ao de início");

            compromisso = buildCompromisso(
                    "Consulta - " + pessoa.getNome(),
                    dto.inicio(), dto.fim(),
                    cliente, usuario, emitente, pessoa
            );
            compromissoRepository.save(compromisso);
            compromisso.setCompromissoPai(compromisso);
            compromissoRepository.save(compromisso);
        }

        Consulta consulta = new Consulta();
        consulta.setCliente(cliente);
        consulta.setCompromisso(compromisso);
        consulta.setEmitente(emitente);
        consulta.setPessoa(pessoa);
        consulta.setStatus(StatusConsulta.AGENDADA);
        consulta.setInicio(compromisso.getInicio());
        consulta.setFim(compromisso.getFim());
        consulta.setObservacao(dto.observacao());
        consulta.setCreatedBy(usuario);

        if (dto.fichaAnamneseId() != null) {
            FichaAnamnese fichaAnamnese = fichaAnamneseRepository
                    .findByIdAndClienteId(dto.fichaAnamneseId(), clienteId)
                    .orElseThrow(() -> new NotFoundException("Ficha de anamnese não encontrada, verifique!"));
            consulta.setFichaAnamnese(fichaAnamnese);
        }

        consultaRepository.save(consulta);

        if (dto.servicos() != null) {
            for (ConsultaServicoCreateDto s : dto.servicos()) {
                criarServico(consulta, s, cliente, usuario);
            }
        }

        try {
            notificationService.notificarCriacao(compromisso);
        } catch (Exception e) {
            log.warn("Falha ao notificar criação da consulta {}: {}", consulta.getId(), e.getMessage());
        }

        return buildResponse(consulta);
    }

    @Transactional
    public ConsultaResponseDto update(Long id, ConsultaUpdateDto dto) {
        if (!dto.fim().isAfter(dto.inicio()))
            throw new BadRequestException("O horário de fim deve ser posterior ao de início");

        Consulta consulta = findById(id);
        Usuario  usuario  = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        validarEdicao(consulta);

        Emitente emitente = emitenteService.findById(dto.emitenteId());
        Pessoa   pessoa   = pessoaService.findById(dto.pessoaId());

        consulta.setEmitente(emitente);
        consulta.setPessoa(pessoa);
        consulta.setInicio(dto.inicio());
        consulta.setFim(dto.fim());
        consulta.setObservacao(dto.observacao());
        consulta.setTipoAjusteGeral(dto.tipoAjusteGeral());
        consulta.setTipoCalculoGeral(dto.tipoCalculoGeral());
        consulta.setValorAjusteGeral(dto.valorAjusteGeral());
        consulta.setUpdatedBy(usuario);

        if (dto.fichaAnamneseId() != null) {
            Long clienteId = securityUtils.getClienteIdLogado();
            FichaAnamnese fichaAnamnese = fichaAnamneseRepository
                    .findByIdAndClienteId(dto.fichaAnamneseId(), clienteId)
                    .orElseThrow(() -> new NotFoundException("Ficha de anamnese não encontrada, verifique!"));
            consulta.setFichaAnamnese(fichaAnamnese);
        } else {
            consulta.setFichaAnamnese(null);
        }

        // Atualiza o compromisso vinculado
        if (consulta.getCompromisso() != null) {
            Compromisso c = consulta.getCompromisso();
            c.setEmitente(emitente);
            c.setPessoa(pessoa);
            c.setInicio(dto.inicio());
            c.setFim(dto.fim());
            c.setTitulo("Consulta - " + pessoa.getNome());
            c.setUpdatedBy(usuario);
            compromissoRepository.save(c);
        }

        return buildResponse(consultaRepository.save(consulta));
    }

    @Transactional
    public ConsultaResponseDto iniciar(Long id) {
        Consulta consulta = findById(id);
        Usuario  usuario  = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (consulta.getStatus() != StatusConsulta.AGENDADA)
            throw new BadRequestException("Consulta deve estar com status AGENDADA para iniciar");

        consulta.setStatus(StatusConsulta.EM_ATENDIMENTO);
        consulta.setUpdatedBy(usuario);
        return buildResponse(consultaRepository.save(consulta));
    }

    @Transactional
    public ConsultaResponseDto concluir(Long id) {
        Long     clienteId = securityUtils.getClienteIdLogado();
        Consulta consulta  = findById(id);
        Cliente  cliente   = clienteService.findById(clienteId);
        Usuario  usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (consulta.getStatus() == StatusConsulta.CONCLUIDA)
            throw new BadRequestException("Consulta já está concluída");
        if (consulta.getStatus() == StatusConsulta.CANCELADA)
            throw new BadRequestException("Não é possível concluir uma consulta cancelada");

        // Baixa estoque para os produtos consumidos (baixarEstoque=true)
        List<ConsultaProduto> paraBaixar = produtoConsumidoRepository.findParaBaixarEstoque(id);
        for (ConsultaProduto cp : paraBaixar) {
            estoqueService.baixarEstoquePorConsumo(
                    clienteId,
                    cp.getEmitente().getId(),
                    cp.getProduto().getId(),
                    cp.getQuantidade(),
                    "Consumo na consulta #" + id,
                    usuario
            );
        }

        consulta.setStatus(StatusConsulta.CONCLUIDA);
        consulta.setUpdatedBy(usuario);

        // Conclui o compromisso vinculado
        if (consulta.getCompromisso() != null) {
            Compromisso c = consulta.getCompromisso();
            c.setConcluido(true);
            c.setUpdatedBy(usuario);
            compromissoRepository.save(c);
        }

        return buildResponse(consultaRepository.save(consulta));
    }

    @Transactional
    public ConsultaResponseDto cancelar(Long id, String motivo) {
        Consulta consulta = findById(id);
        Usuario  usuario  = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (consulta.getStatus() == StatusConsulta.CANCELADA)
            throw new BadRequestException("Consulta já está cancelada");
        if (consulta.getStatus() == StatusConsulta.CONCLUIDA)
            throw new BadRequestException("Não é possível cancelar uma consulta já concluída");

        consulta.setStatus(StatusConsulta.CANCELADA);
        consulta.setMotivoCancelamento(motivo);
        consulta.setUpdatedBy(usuario);

        // Cancela o compromisso vinculado
        if (consulta.getCompromisso() != null) {
            Compromisso c = consulta.getCompromisso();
            if (!Boolean.TRUE.equals(c.getConcluido()) && !Boolean.TRUE.equals(c.getCancelado())) {
                c.setCancelado(true);
                c.setMotivoCancelamento(motivo != null ? motivo : "Consulta cancelada");
                c.setUpdatedBy(usuario);
                compromissoRepository.save(c);
            }
            try {
                notificationService.notificarCancelamento(c);
            } catch (Exception e) {
                log.warn("Falha ao notificar cancelamento da consulta {}: {}", id, e.getMessage());
            }
        }

        return buildResponse(consultaRepository.save(consulta));
    }

    @Transactional
    public ConsultaResponseDto gerarReconsulta(Long id, ReconsultaCreateDto dto) {
        if (!dto.fim().isAfter(dto.inicio()))
            throw new BadRequestException("O horário de fim deve ser posterior ao de início");

        Consulta original  = findById(id);
        Long     clienteId = securityUtils.getClienteIdLogado();
        Cliente  cliente   = clienteService.findById(clienteId);
        Usuario  usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (original.getStatus() == StatusConsulta.CANCELADA)
            throw new BadRequestException("Não é possível gerar reconsulta de uma consulta cancelada");

        Emitente emitente = dto.emitenteId() != null
                ? emitenteService.findById(dto.emitenteId())
                : original.getEmitente();
        Pessoa   pessoa   = original.getPessoa();

        // Novo compromisso para a reconsulta
        Compromisso novoCompromisso = buildCompromisso(
                "Consulta - " + pessoa.getNome(),
                dto.inicio(), dto.fim(),
                cliente, usuario, emitente, pessoa
        );
        compromissoRepository.save(novoCompromisso);
        novoCompromisso.setCompromissoPai(novoCompromisso);
        compromissoRepository.save(novoCompromisso);

        Consulta reconsulta = new Consulta();
        reconsulta.setCliente(cliente);
        reconsulta.setCompromisso(novoCompromisso);
        reconsulta.setEmitente(emitente);
        reconsulta.setPessoa(pessoa);
        reconsulta.setStatus(StatusConsulta.AGENDADA);
        reconsulta.setInicio(dto.inicio());
        reconsulta.setFim(dto.fim());
        reconsulta.setObservacao(dto.observacao());
        reconsulta.setConsultaPai(original);
        reconsulta.setCreatedBy(usuario);
        consultaRepository.save(reconsulta);

        // Copia os serviços da consulta original
        List<ConsultaServico> servicosOriginais = servicoRepository
                .findByConsultaIdAndClienteId(id, clienteId);
        for (ConsultaServico s : servicosOriginais) {
            ConsultaServico copia = new ConsultaServico();
            copia.setCliente(cliente);
            copia.setConsulta(reconsulta);
            copia.setProduto(s.getProduto());
            copia.setQuantidade(s.getQuantidade());
            copia.setPrecoUnitario(s.getPrecoUnitario());
            copia.setCreatedBy(usuario);
            servicoRepository.save(copia);
        }

        try {
            notificationService.notificarCriacao(novoCompromisso);
        } catch (Exception e) {
            log.warn("Falha ao notificar criação da reconsulta {}: {}", reconsulta.getId(), e.getMessage());
        }

        return buildResponse(reconsulta);
    }

    // ── Serviços ──────────────────────────────────────────────────────────────

    @Transactional
    public ConsultaServicoResponseDto adicionarServico(Long consultaId, ConsultaServicoCreateDto dto) {
        Long     clienteId = securityUtils.getClienteIdLogado();
        Consulta consulta  = findById(consultaId);
        Cliente  cliente   = clienteService.findById(clienteId);
        Usuario  usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        validarEdicao(consulta);

        ConsultaServico servico = criarServico(consulta, dto, cliente, usuario);
        return ConsultaMapper.toServicoDto(servico);
    }

    @Transactional
    public ConsultaServicoResponseDto atualizarServico(Long consultaId, Long servicoId, ConsultaServicoCreateDto dto) {
        Long     clienteId = securityUtils.getClienteIdLogado();
        Consulta consulta  = findById(consultaId);
        Usuario  usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        validarEdicao(consulta);

        ConsultaServico servico = servicoRepository
                .findByIdAndConsultaIdAndClienteId(servicoId, consultaId, clienteId)
                .orElseThrow(() -> new NotFoundException("Serviço não encontrado"));

        Produto produto = produtoRepository.findByIdAndClienteId(dto.produtoId(), clienteId)
                .orElseThrow(() -> new NotFoundException("Produto não encontrado"));

        servico.setProduto(produto);
        servico.setQuantidade(dto.quantidade());
        servico.setPrecoUnitario(dto.precoUnitario());
        servico.setTipoAjuste(dto.tipoAjuste());
        servico.setTipoCalculo(dto.tipoCalculo());
        servico.setValorAjuste(dto.valorAjuste());
        servico.setUpdatedBy(usuario);
        return ConsultaMapper.toServicoDto(servicoRepository.save(servico));
    }

    @Transactional
    public void removerServico(Long consultaId, Long servicoId) {
        Long     clienteId = securityUtils.getClienteIdLogado();
        Consulta consulta  = findById(consultaId);

        validarEdicao(consulta);

        ConsultaServico servico = servicoRepository
                .findByIdAndConsultaIdAndClienteId(servicoId, consultaId, clienteId)
                .orElseThrow(() -> new NotFoundException("Serviço não encontrado"));

        servicoRepository.delete(servico);
    }

    // ── Produtos consumidos ───────────────────────────────────────────────────

    @Transactional
    public ConsultaProdutoResponseDto adicionarProduto(Long consultaId, ConsultaProdutoCreateDto dto) {
        Long     clienteId = securityUtils.getClienteIdLogado();
        Consulta consulta  = findById(consultaId);
        Cliente  cliente   = clienteService.findById(clienteId);
        Usuario  usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        validarEdicao(consulta);

        Produto  produto  = produtoRepository.findByIdAndClienteId(dto.produtoId(), clienteId)
                .orElseThrow(() -> new NotFoundException("Produto não encontrado"));
        Emitente emitente = emitenteService.findById(dto.emitenteId());

        ConsultaProduto cp = new ConsultaProduto();
        cp.setCliente(cliente);
        cp.setConsulta(consulta);
        cp.setProduto(produto);
        cp.setEmitente(emitente);
        BigDecimal precoVenda = estoqueService.getPrecoVenda(dto.emitenteId(), dto.produtoId());
        cp.setQuantidade(dto.quantidade());
        cp.setPrecoUnitario(precoVenda);
        cp.setTipoAjuste(dto.tipoAjuste());
        cp.setTipoCalculo(dto.tipoCalculo());
        cp.setValorAjuste(dto.valorAjuste());
        cp.setCreatedBy(usuario);
        return ConsultaMapper.toProdutoDto(produtoConsumidoRepository.save(cp));
    }

    @Transactional
    public ConsultaProdutoResponseDto atualizarProduto(Long consultaId, Long produtoId, ConsultaProdutoCreateDto dto) {
        Long     clienteId = securityUtils.getClienteIdLogado();
        Consulta consulta  = findById(consultaId);
        Usuario  usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        validarEdicao(consulta);

        ConsultaProduto cp = produtoConsumidoRepository
                .findByIdAndConsultaIdAndClienteId(produtoId, consultaId, clienteId)
                .orElseThrow(() -> new NotFoundException("Produto consumido não encontrado"));

        Produto  novoProduto = produtoRepository.findByIdAndClienteId(dto.produtoId(), clienteId)
                .orElseThrow(() -> new NotFoundException("Produto não encontrado"));
        Emitente emitente    = emitenteService.findById(dto.emitenteId());

        BigDecimal novoPreco = estoqueService.getPrecoVenda(dto.emitenteId(), dto.produtoId());
        cp.setProduto(novoProduto);
        cp.setEmitente(emitente);
        cp.setQuantidade(dto.quantidade());
        cp.setPrecoUnitario(novoPreco);
        cp.setTipoAjuste(dto.tipoAjuste());
        cp.setTipoCalculo(dto.tipoCalculo());
        cp.setValorAjuste(dto.valorAjuste());
        cp.setUpdatedBy(usuario);
        return ConsultaMapper.toProdutoDto(produtoConsumidoRepository.save(cp));
    }

    @Transactional
    public void removerProduto(Long consultaId, Long produtoId) {
        Long     clienteId = securityUtils.getClienteIdLogado();
        Consulta consulta  = findById(consultaId);

        validarEdicao(consulta);

        ConsultaProduto cp = produtoConsumidoRepository
                .findByIdAndConsultaIdAndClienteId(produtoId, consultaId, clienteId)
                .orElseThrow(() -> new NotFoundException("Produto consumido não encontrado"));

        produtoConsumidoRepository.delete(cp);
    }

    // ── PDF / WhatsApp ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public void enviarPdfWhatsapp(Long consultaId, com.api.ero_erp.clinica.dtos.EnviarPdfConsultaDto dto) {
        Consulta consulta = findById(consultaId);
        notificationService.enviarPdfParaCliente(
                consulta.getPessoa().getId(),
                consulta.getCliente().getId(),
                securityUtils.getUsuarioIdLogado(),
                dto.base64(),
                dto.fileName(),
                dto.caption()
        );
    }

    // ── Auxiliares ────────────────────────────────────────────────────────────

    private ConsultaResponseDto buildResponse(Consulta consulta) {
        Long clienteId = securityUtils.getClienteIdLogado();
        List<ConsultaServico>  servicos = servicoRepository
                .findByConsultaIdAndClienteId(consulta.getId(), clienteId);
        List<ConsultaProduto>  produtos = produtoConsumidoRepository
                .findByConsultaIdAndClienteId(consulta.getId(), clienteId);
        return ConsultaMapper.toDto(consulta, servicos, produtos);
    }

    private ConsultaServico criarServico(
            Consulta consulta, ConsultaServicoCreateDto dto, Cliente cliente, Usuario usuario
    ) {
        Long clienteId = cliente.getId();
        Produto produto = produtoRepository.findByIdAndClienteId(dto.produtoId(), clienteId)
                .orElseThrow(() -> new NotFoundException("Produto não encontrado"));

        ConsultaServico cs = new ConsultaServico();
        cs.setCliente(cliente);
        cs.setConsulta(consulta);
        cs.setProduto(produto);
        cs.setQuantidade(dto.quantidade());
        cs.setPrecoUnitario(dto.precoUnitario());
        cs.setTipoAjuste(dto.tipoAjuste());
        cs.setTipoCalculo(dto.tipoCalculo());
        cs.setValorAjuste(dto.valorAjuste());
        cs.setCreatedBy(usuario);
        return servicoRepository.save(cs);
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

    private void validarEdicao(Consulta consulta) {
        if (consulta.getStatus() == StatusConsulta.CONCLUIDA)
            throw new BadRequestException("Não é possível editar uma consulta já concluída");
        if (consulta.getStatus() == StatusConsulta.CANCELADA)
            throw new BadRequestException("Não é possível editar uma consulta cancelada");
    }
}
