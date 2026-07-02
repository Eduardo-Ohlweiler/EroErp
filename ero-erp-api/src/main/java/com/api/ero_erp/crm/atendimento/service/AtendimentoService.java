package com.api.ero_erp.crm.atendimento.service;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.crm.andamento.entity.Andamento;
import com.api.ero_erp.crm.andamento.repository.AndamentoRepository;
import com.api.ero_erp.crm.atendimento.dtos.AssumirAtendimentoDto;
import com.api.ero_erp.crm.atendimento.dtos.AtendimentoResponseDto;
import com.api.ero_erp.crm.atendimento.dtos.EnviarMensagemDto;
import com.api.ero_erp.crm.atendimento.dtos.MensagemResponseDto;
import com.api.ero_erp.crm.atendimento.entity.Atendimento;
import com.api.ero_erp.crm.atendimento.entity.AtendimentoAssuncao;
import com.api.ero_erp.crm.atendimento.entity.Mensagem;
import com.api.ero_erp.crm.atendimento.enums.DirecaoMensagem;
import com.api.ero_erp.crm.atendimento.enums.TipoMensagem;
import com.api.ero_erp.crm.atendimento.mapper.AtendimentoMapper;
import com.api.ero_erp.crm.atendimento.mapper.MensagemMapper;
import com.api.ero_erp.crm.atendimento.repository.AtendimentoAssuncaoRepository;
import com.api.ero_erp.crm.atendimento.repository.AtendimentoRepository;
import com.api.ero_erp.crm.atendimento.repository.MensagemRepository;
import com.api.ero_erp.crm.configuracaocrm.entity.ConfiguracaoCrm;
import com.api.ero_erp.crm.configuracaocrm.repository.ConfiguracaoCrmRepository;
import com.api.ero_erp.crm.sse.CrmSseService;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
import com.api.ero_erp.whatsapp.service.WhatsappEvolutionClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class AtendimentoService {

    private static final Logger log = LoggerFactory.getLogger(AtendimentoService.class);

    private final AtendimentoRepository          atendimentoRepository;
    private final MensagemRepository             mensagemRepository;
    private final AtendimentoAssuncaoRepository  assuncaoRepository;
    private final AndamentoRepository            andamentoRepository;
    private final ConfiguracaoCrmRepository      configuracaoCrmRepository;
    private final UsuarioRepository              usuarioRepository;
    private final WhatsappEvolutionClient        evolutionClient;
    private final CrmSseService                  sseService;
    private final SecurityUtils                  securityUtils;

    public AtendimentoService(
            AtendimentoRepository         atendimentoRepository,
            MensagemRepository            mensagemRepository,
            AtendimentoAssuncaoRepository assuncaoRepository,
            AndamentoRepository           andamentoRepository,
            ConfiguracaoCrmRepository     configuracaoCrmRepository,
            UsuarioRepository             usuarioRepository,
            WhatsappEvolutionClient       evolutionClient,
            CrmSseService                 sseService,
            SecurityUtils                 securityUtils
    ) {
        this.atendimentoRepository     = atendimentoRepository;
        this.mensagemRepository        = mensagemRepository;
        this.assuncaoRepository        = assuncaoRepository;
        this.andamentoRepository       = andamentoRepository;
        this.configuracaoCrmRepository = configuracaoCrmRepository;
        this.usuarioRepository         = usuarioRepository;
        this.evolutionClient           = evolutionClient;
        this.sseService                = sseService;
        this.securityUtils             = securityUtils;
    }

    @Transactional(readOnly = true)
    public List<AtendimentoResponseDto> listarKanban(Long usuarioId, Long andamentoId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return atendimentoRepository.listarKanban(clienteId, usuarioId, andamentoId)
                .stream()
                .map(AtendimentoMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public AtendimentoResponseDto getAtendimento(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return atendimentoRepository.findByIdAndClienteId(id, clienteId)
                .map(AtendimentoMapper::toDto)
                .orElseThrow(() -> new NotFoundException("Atendimento não encontrado, verifique!"));
    }

    @Transactional(readOnly = true)
    public Page<MensagemResponseDto> listarMensagens(Long atendimentoId, Pageable pageable) {
        Long clienteId = securityUtils.getClienteIdLogado();
        // valida que o atendimento pertence ao cliente
        atendimentoRepository.findByIdAndClienteId(atendimentoId, clienteId)
                .orElseThrow(() -> new NotFoundException("Atendimento não encontrado, verifique!"));
        return mensagemRepository.findByAtendimento(pageable, atendimentoId, clienteId)
                .map(MensagemMapper::toDto);
    }

    @Transactional
    public AtendimentoResponseDto moverAndamento(Long id, Long andamentoId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        Atendimento atendimento = atendimentoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Atendimento não encontrado, verifique!"));

        Andamento andamento = andamentoRepository.findById(andamentoId)
                .filter(a -> a.getCliente() == null || a.getCliente().getId().equals(clienteId))
                .orElseThrow(() -> new NotFoundException("Andamento não encontrado, verifique!"));

        atendimento.setAndamento(andamento);

        if (Boolean.TRUE.equals(andamento.getConcluiAtendimento())
                || Boolean.TRUE.equals(andamento.getCancelaAtendimento())) {
            atendimento.setDataConclusao(LocalDateTime.now());
            atendimento.setAtivo(false);
        } else {
            // reabertura ao mover para um andamento não terminal
            atendimento.setDataConclusao(null);
            atendimento.setAtivo(true);
        }

        Atendimento salvo = atendimentoRepository.save(atendimento);
        AtendimentoResponseDto dto = AtendimentoMapper.toDto(salvo);
        sseService.emit(clienteId, "atendimento-atualizado", dto);
        log.info("Atendimento {} movido para andamento {} pelo cliente {}", id, andamentoId, clienteId);
        return dto;
    }

    @Transactional
    public MensagemResponseDto enviarMensagem(Long id, EnviarMensagemDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();
        Long usuarioId = securityUtils.getUsuarioIdLogado();

        Atendimento atendimento = atendimentoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Atendimento não encontrado, verifique!"));

        ConfiguracaoCrm config = carregarConfigValida(clienteId);

        TipoMensagem tipo = parseTipo(dto.tipo());
        String numero = atendimento.getNumero();

        String evolutionMessageId = null;

        try {
            switch (tipo) {
                case TEXTO -> {
                    if (dto.conteudo() == null || dto.conteudo().isBlank())
                        throw new BadRequestException("Conteúdo da mensagem é obrigatório, verifique!");
                    evolutionClient.enviar(config.getApiUrl(), config.getInstanceName(), config.getApiKey(),
                            numero, dto.conteudo());
                }
                case AUDIO -> {
                    if (dto.base64() == null || dto.base64().isBlank())
                        throw new BadRequestException("Áudio é obrigatório, verifique!");
                    evolutionMessageId = evolutionClient.enviarAudio(config.getApiUrl(), config.getInstanceName(), config.getApiKey(),
                            numero, dto.base64());
                }
                case IMAGEM, VIDEO, DOCUMENTO -> {
                    if (dto.base64() == null || dto.base64().isBlank())
                        throw new BadRequestException("Mídia é obrigatória, verifique!");
                    evolutionMessageId = evolutionClient.enviarMidia(config.getApiUrl(), config.getInstanceName(), config.getApiKey(),
                            numero, dto.base64(), mediatypeDe(tipo), dto.mimetype(), dto.fileName(), dto.conteudo());
                }
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Falha ao enviar mensagem no atendimento {}: {}", id, e.getMessage());
            throw new BadRequestException("Falha ao enviar mensagem via WhatsApp, verifique!");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);

        Mensagem mensagem = new Mensagem();
        mensagem.setCliente(atendimento.getCliente());
        mensagem.setAtendimento(atendimento);
        mensagem.setDirecao(DirecaoMensagem.ENVIADA);
        mensagem.setTipo(tipo);
        mensagem.setConteudo(dto.conteudo());
        mensagem.setMidiaMimetype(dto.mimetype());
        mensagem.setMidiaNome(dto.fileName());
        mensagem.setEvolutionMessageId(evolutionMessageId);
        mensagem.setUsuario(usuario);
        mensagem.setStatus("ENVIADA");
        mensagem.setDataMensagem(LocalDateTime.now());
        Mensagem salva = mensagemRepository.save(mensagem);

        atendimento.setDataUltimaMensagem(salva.getDataMensagem());
        atendimentoRepository.save(atendimento);

        MensagemResponseDto respDto = MensagemMapper.toDto(salva);
        sseService.emit(clienteId, "mensagem-nova", respDto);
        sseService.emit(clienteId, "atendimento-atualizado", AtendimentoMapper.toDto(atendimento));
        log.info("Mensagem {} enviada no atendimento {} por usuário {}", salva.getId(), id, usuarioId);
        return respDto;
    }

    @Transactional
    public AtendimentoResponseDto pegar(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        Long usuarioId = securityUtils.getUsuarioIdLogado();

        Atendimento atendimento = atendimentoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Atendimento não encontrado, verifique!"));

        if (atendimento.getUsuario() != null)
            throw new BadRequestException("Atendimento já possui dono; use Assumir informando o motivo, verifique!");

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado, verifique!"));
        atendimento.setUsuario(usuario);

        Atendimento salvo = atendimentoRepository.save(atendimento);
        AtendimentoResponseDto dto = AtendimentoMapper.toDto(salvo);
        sseService.emit(clienteId, "atendimento-atualizado", dto);
        log.info("Atendimento {} pego pelo usuário {}", id, usuarioId);
        return dto;
    }

    @Transactional
    public AtendimentoResponseDto assumir(Long id, AssumirAtendimentoDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();
        Long usuarioId = securityUtils.getUsuarioIdLogado();

        Atendimento atendimento = atendimentoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Atendimento não encontrado, verifique!"));

        Usuario anterior = atendimento.getUsuario();

        if (anterior != null && (dto == null || dto.motivo() == null || dto.motivo().isBlank()))
            throw new BadRequestException("Motivo é obrigatório para assumir um atendimento com dono, verifique!");

        Usuario novo = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado, verifique!"));

        atendimento.setUsuario(novo);
        Atendimento salvo = atendimentoRepository.save(atendimento);

        AtendimentoAssuncao assuncao = new AtendimentoAssuncao();
        assuncao.setCliente(atendimento.getCliente());
        assuncao.setAtendimento(salvo);
        assuncao.setUsuario(novo);
        assuncao.setUsuarioAnterior(anterior);
        assuncao.setMotivo(dto != null ? dto.motivo() : null);
        assuncao.setData(LocalDateTime.now());
        assuncaoRepository.save(assuncao);

        AtendimentoResponseDto respDto = AtendimentoMapper.toDto(salvo);
        sseService.emit(clienteId, "atendimento-atualizado", respDto);
        log.info("Atendimento {} assumido pelo usuário {} (anterior: {})", id, usuarioId,
                anterior != null ? anterior.getId() : null);
        return respDto;
    }

    /**
     * Proxy de mídia: baixa o binário da Evolution sob demanda e devolve base64 + mimetype.
     */
    @Transactional(readOnly = true)
    public MidiaBaixada baixarMidia(Long mensagemId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        Mensagem mensagem = mensagemRepository.findByIdAndClienteId(mensagemId, clienteId)
                .orElseThrow(() -> new NotFoundException("Mensagem não encontrada, verifique!"));

        if (mensagem.getEvolutionMessageId() == null || mensagem.getEvolutionMessageId().isBlank())
            throw new BadRequestException("Mensagem não possui mídia disponível, verifique!");

        ConfiguracaoCrm config = carregarConfigValida(clienteId);

        Map<?, ?> body = evolutionClient.baixarMidiaBase64(
                config.getApiUrl(), config.getInstanceName(), config.getApiKey(),
                mensagem.getEvolutionMessageId());

        String base64   = body != null && body.get("base64")   != null ? body.get("base64").toString()   : null;
        String mimetype = body != null && body.get("mimetype") != null ? body.get("mimetype").toString() : null;

        if (base64 == null)
            throw new NotFoundException("Mídia não disponível na Evolution, verifique!");

        if (mimetype == null || mimetype.isBlank())
            mimetype = mensagem.getMidiaMimetype() != null ? mensagem.getMidiaMimetype() : "application/octet-stream";

        return new MidiaBaixada(java.util.Base64.getDecoder().decode(base64), mimetype);
    }

    public record MidiaBaixada(byte[] bytes, String mimetype) {}

    // ----------------------------------------------------------------- helpers

    private ConfiguracaoCrm carregarConfigValida(Long clienteId) {
        ConfiguracaoCrm config = configuracaoCrmRepository.findByClienteId(clienteId)
                .orElseThrow(() -> new BadRequestException("Configuração do CRM não encontrada, verifique!"));

        if (config.getApiUrl() == null || config.getApiUrl().isBlank()
                || config.getInstanceName() == null || config.getInstanceName().isBlank()
                || config.getApiKey() == null || config.getApiKey().isBlank()) {
            throw new BadRequestException("Configuração do CRM incompleta, verifique!");
        }
        return config;
    }

    private TipoMensagem parseTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) return TipoMensagem.TEXTO;
        try {
            return TipoMensagem.valueOf(tipo.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Tipo de mensagem inválido, verifique!");
        }
    }

    private String mediatypeDe(TipoMensagem tipo) {
        return switch (tipo) {
            case IMAGEM    -> "image";
            case VIDEO     -> "video";
            case DOCUMENTO -> "document";
            default        -> "document";
        };
    }
}
