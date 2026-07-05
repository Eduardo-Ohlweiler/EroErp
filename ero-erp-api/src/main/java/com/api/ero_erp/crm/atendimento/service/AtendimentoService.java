package com.api.ero_erp.crm.atendimento.service;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.crm.andamento.entity.Andamento;
import com.api.ero_erp.crm.andamento.repository.AndamentoRepository;
import com.api.ero_erp.crm.atendimento.dtos.AssumirAtendimentoDto;
import com.api.ero_erp.crm.atendimento.dtos.AtendimentoListaResponseDto;
import com.api.ero_erp.crm.atendimento.dtos.AtendimentoResponseDto;
import com.api.ero_erp.crm.atendimento.dtos.EnviarMensagemDto;
import com.api.ero_erp.crm.atendimento.dtos.IniciarAtendimentoDto;
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
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.repository.PessoaRepository;
import com.api.ero_erp.telefone.entity.Telefone;
import com.api.ero_erp.telefone.repository.TelefoneRepository;
import com.api.ero_erp.telefone.util.TelefoneUtils;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
import com.api.ero_erp.whatsapp.service.WhatsappEvolutionClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class AtendimentoService {

    private static final Logger log = LoggerFactory.getLogger(AtendimentoService.class);

    /** Chave do andamento (coluna) inicial onde os atendimentos novos são abertos. */
    private static final String CHAVE_AGUARDANDO = "AGUARDANDO_ATENDIMENTO";

    private final AtendimentoRepository          atendimentoRepository;
    private final MensagemRepository             mensagemRepository;
    private final AtendimentoAssuncaoRepository  assuncaoRepository;
    private final AndamentoRepository            andamentoRepository;
    private final ConfiguracaoCrmRepository      configuracaoCrmRepository;
    private final UsuarioRepository              usuarioRepository;
    private final PessoaRepository               pessoaRepository;
    private final TelefoneRepository             telefoneRepository;
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
            PessoaRepository              pessoaRepository,
            TelefoneRepository            telefoneRepository,
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
        this.pessoaRepository          = pessoaRepository;
        this.telefoneRepository        = telefoneRepository;
        this.evolutionClient           = evolutionClient;
        this.sseService                = sseService;
        this.securityUtils             = securityUtils;
    }

    // Finalizados (concluído/cancelado): no carregamento normal traz os N mais recentes;
    // ao filtrar por um andamento terminal, traz todos dos últimos DIAS (com teto de segurança).
    private static final int LIMITE_FINALIZADOS_PADRAO = 30;
    private static final int DIAS_FINALIZADOS_FILTRO   = 5;
    private static final int TETO_FINALIZADOS_FILTRO   = 500;

    @Transactional(readOnly = true)
    public List<AtendimentoResponseDto> listarKanban(Long usuarioId, Long andamentoId) {
        Long clienteId = securityUtils.getClienteIdLogado();

        if (andamentoId != null) {
            boolean terminal = andamentoRepository.findById(andamentoId)
                    .map(a -> Boolean.TRUE.equals(a.getConcluiAtendimento())
                           || Boolean.TRUE.equals(a.getCancelaAtendimento()))
                    .orElse(false);
            if (terminal) {
                // filtro por terminal: todos os finalizados desse andamento nos últimos N dias
                LocalDateTime desde = LocalDateTime.now().minusDays(DIAS_FINALIZADOS_FILTRO);
                return atendimentoRepository
                        .listarFinalizadosPorAndamentoDesde(clienteId, usuarioId, andamentoId, desde,
                                PageRequest.of(0, TETO_FINALIZADOS_FILTRO))
                        .stream().map(AtendimentoMapper::toDto).toList();
            }
            // andamento não-terminal: só os ativos daquele andamento
            return atendimentoRepository.listarKanban(clienteId, usuarioId, andamentoId)
                    .stream().map(AtendimentoMapper::toDto).toList();
        }

        // carregamento normal (sem filtro): ativos + os últimos 30 finalizados
        List<AtendimentoResponseDto> resultado = new java.util.ArrayList<>(
                atendimentoRepository.listarKanban(clienteId, usuarioId, null)
                        .stream().map(AtendimentoMapper::toDto).toList());
        atendimentoRepository
                .listarUltimosFinalizados(clienteId, usuarioId, PageRequest.of(0, LIMITE_FINALIZADOS_PADRAO))
                .stream().map(AtendimentoMapper::toDto).forEach(resultado::add);
        return resultado;
    }

    @Transactional(readOnly = true)
    public AtendimentoResponseDto getAtendimento(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return atendimentoRepository.findByIdAndClienteId(id, clienteId)
                .map(AtendimentoMapper::toDto)
                .orElseThrow(() -> new NotFoundException("Atendimento não encontrado, verifique!"));
    }

    /**
     * Listagem completa e paginada de atendimentos, ordenada por data de contato (dataAbertura)
     * do mais recente ao mais antigo. Carrega, em uma única query, a última assunção de cada
     * atendimento da página (quem assumiu e quando), evitando N+1.
     */
    @Transactional(readOnly = true)
    public Page<AtendimentoListaResponseDto> listarPaginado(
            Long andamentoId, Long usuarioId, String busca,
            LocalDateTime dataInicio, LocalDateTime dataFim, Pageable pageable) {

        Long clienteId = securityUtils.getClienteIdLogado();
        String buscaFiltro = (busca != null && !busca.isBlank()) ? busca.trim() : null;

        Page<Atendimento> pagina = atendimentoRepository.listarPaginado(
                clienteId, andamentoId, usuarioId, buscaFiltro, dataInicio, dataFim, pageable);

        List<Long> ids = pagina.getContent().stream().map(Atendimento::getId).toList();

        // última assunção por atendimento (lista já vem ordenada por data DESC → mantém a primeira)
        Map<Long, AtendimentoAssuncao> ultimaAssuncaoPorAtendimento = ids.isEmpty()
                ? Map.of()
                : assuncaoRepository.findByAtendimentoIdIn(ids).stream()
                        .collect(java.util.stream.Collectors.toMap(
                                aa -> aa.getAtendimento().getId(),
                                aa -> aa,
                                (existente, novo) -> existente));

        return pagina.map(a -> AtendimentoMapper.toListaDto(a, ultimaAssuncaoPorAtendimento.get(a.getId())));
    }

    /** Vincula uma pessoa (cadastro existente) a um atendimento, ambos do cliente logado. */
    @Transactional
    public AtendimentoResponseDto vincularPessoa(Long atendimentoId, Long pessoaId) {
        Long clienteId = securityUtils.getClienteIdLogado();

        Atendimento atendimento = atendimentoRepository.findByIdAndClienteId(atendimentoId, clienteId)
                .orElseThrow(() -> new NotFoundException("Atendimento não encontrado, verifique!"));

        Pessoa pessoa = pessoaRepository.findByIdAndClienteId(pessoaId, clienteId)
                .orElseThrow(() -> new NotFoundException("Pessoa não encontrada, verifique!"));

        atendimento.setPessoa(pessoa);
        Atendimento salvo = atendimentoRepository.save(atendimento);

        AtendimentoResponseDto dto = AtendimentoMapper.toDto(salvo);
        sseService.emit(clienteId, "atendimento-atualizado", dto);
        log.info("Pessoa {} vinculada ao atendimento {} pelo cliente {}", pessoaId, atendimentoId, clienteId);
        return dto;
    }

    /**
     * Inicia um atendimento proativamente a partir do Kanban (o atendente "entra em contato").
     * Reaproveita a mesma lógica de coluna inicial/auto-vínculo do webhook, mas define o
     * atendente logado como dono. Se já existir um atendimento aberto para o número — ou para
     * a pessoa, em qualquer telefone dela — bloqueia e informa quem é o dono da conversa.
     */
    @Transactional
    public AtendimentoResponseDto iniciarAtendimento(IniciarAtendimentoDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();
        Long usuarioId = securityUtils.getUsuarioIdLogado();

        String numero = normalizarNumero(dto.numero());
        if (numero == null || numero.isBlank())
            throw new BadRequestException("Número inválido, verifique!");

        // exige a configuração do CRM: sem ela não há como enviar a mensagem depois
        ConfiguracaoCrm config = carregarConfigValida(clienteId);

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado, verifique!"));

        Pessoa pessoa = null;
        if (dto.pessoaId() != null) {
            pessoa = pessoaRepository.findByIdAndClienteId(dto.pessoaId(), clienteId)
                    .orElseThrow(() -> new NotFoundException("Pessoa não encontrada, verifique!"));
        }

        // bloqueia se já houver conversa aberta (não concluída/cancelada) para o número
        // (em qualquer variante do nono dígito) ou para a pessoa em qualquer outro telefone dela
        List<Atendimento> abertos = atendimentoRepository.findAbertosByClienteAndNumeros(
                clienteId, variantesNumero(numero));
        if (abertos.isEmpty() && pessoa != null) {
            abertos = atendimentoRepository.findAbertosByClienteAndPessoa(clienteId, pessoa.getId());
        }
        if (!abertos.isEmpty()) {
            Atendimento existente = abertos.get(0);
            String dono = existente.getUsuario() != null
                    ? "com o usuário " + existente.getUsuario().getNome()
                    : "sem dono (aguardando atendimento)";
            throw new BadRequestException(
                    "Já existe um atendimento aberto para este contato " + dono + ", verifique!");
        }

        Atendimento atendimento = acharOuCriarAtendimento(config, clienteId, numero,
                pessoa != null ? pessoa.getNome() : null, usuario, pessoa);

        Atendimento salvo = atendimentoRepository.save(atendimento);
        AtendimentoResponseDto respDto = AtendimentoMapper.toDto(salvo);
        sseService.emit(clienteId, "atendimento-atualizado", respDto);
        log.info("Atendimento {} iniciado (proativo) para número {} pelo usuário {}",
                salvo.getId(), numero, usuarioId);
        return respDto;
    }

    /**
     * Acha o atendimento aberto do número (dedupe: no máx. 1 aberto por cliente+número) ou constrói
     * um novo (NÃO persistido — id nulo) na coluna inicial {@code AGUARDANDO_ATENDIMENTO}. {@code dono}
     * e {@code pessoaForcada} são aplicados somente quando um novo atendimento é criado; num atendimento
     * já aberto nada é alterado. Quando {@code pessoaForcada} é nulo, tenta o auto-vínculo por telefone
     * cadastrado e, em último caso, herda a pessoa do último atendimento do mesmo número.
     * Usado tanto pelo webhook (mensagem recebida, sem dono) quanto pelo contato proativo do Kanban.
     */
    public Atendimento acharOuCriarAtendimento(ConfiguracaoCrm config, Long clienteId,
                                               String numero, String pushName,
                                               Usuario dono, Pessoa pessoaForcada) {
        List<String> variantes = variantesNumero(numero);

        List<Atendimento> abertos = atendimentoRepository.findAbertosByClienteAndNumeros(clienteId, variantes);
        if (!abertos.isEmpty()) {
            return abertos.get(0);
        }

        Andamento aguardando = andamentoRepository.findByChave(CHAVE_AGUARDANDO)
                .orElseGet(() -> andamentoRepository.listarAtivosParaKanban(clienteId)
                        .stream().findFirst().orElse(null));

        Atendimento atendimento = new Atendimento();
        atendimento.setCliente(config.getCliente());
        atendimento.setNumero(numero);
        atendimento.setContatoNome(pushName);
        atendimento.setAndamento(aguardando);
        atendimento.setAtivo(true);
        atendimento.setDataAbertura(LocalDateTime.now());
        if (dono != null) atendimento.setUsuario(dono);

        if (pessoaForcada != null) {
            atendimento.setPessoa(pessoaForcada);
            return atendimento;
        }

        // auto-vínculo de pessoa por telefone cadastrado.
        // 'numero' vem completo (DDI+DDD+número); casa exato pela concatenação DDI+número
        // (nas variantes com/sem o nono dígito) e, em último caso, por sufixo (números
        // legados sem DDI/formatados). Havendo mais de um, usa o primeiro (principal antes).
        Telefone telefone = telefoneRepository.findByClienteIdAndNumeroCompleto(clienteId, variantes)
                .stream().findFirst()
                .orElseGet(() -> variantes.stream()
                        .flatMap(n -> telefoneRepository.findByClienteIdAndNumeroSufixo(clienteId, n).stream())
                        .findFirst().orElse(null));
        if (telefone != null && telefone.getPessoa() != null) {
            atendimento.setPessoa(telefone.getPessoa());
        }

        // memória de vínculo: se não casou por telefone cadastrado, herda a pessoa do
        // último atendimento desse mesmo número que já teve vínculo (manual ou automático).
        if (atendimento.getPessoa() == null) {
            atendimentoRepository
                    .findFirstByClienteIdAndNumeroInAndPessoaIsNotNullOrderByDataAberturaDesc(clienteId, variantes)
                    .ifPresent(anterior -> atendimento.setPessoa(anterior.getPessoa()));
        }

        return atendimento;
    }

    /**
     * Normaliza um número para apenas dígitos com DDI. O front já envia com DDI (código do país +
     * DDD + número); como salvaguarda, prefixa "55" quando vier um número nacional (10 ou 11 dígitos).
     */
    private String normalizarNumero(String numero) {
        if (numero == null) return null;
        String digitos = numero.replaceAll("\\D", "");
        if (digitos.length() == 10 || digitos.length() == 11) {
            digitos = "55" + digitos;
        }
        return digitos;
    }

    /**
     * Variantes de um número para busca (com/sem o nono dígito brasileiro).
     * Regra centralizada em {@link TelefoneUtils#variantes(String)}.
     */
    private List<String> variantesNumero(String numero) {
        return TelefoneUtils.variantes(numero);
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
                    evolutionMessageId = evolutionClient.enviar(config.getApiUrl(), config.getInstanceName(), config.getApiKey(),
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
     * Marca a conversa como lida (zera o contador de não-lidas) e, se habilitado na
     * configuração, envia a confirmação de leitura (visto) ao cliente no WhatsApp.
     */
    @Transactional
    public void marcarLido(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        Atendimento atendimento = atendimentoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Atendimento não encontrado, verifique!"));

        boolean tinhaNaoLidas = atendimento.getMensagensNaoLidas() != null
                && atendimento.getMensagensNaoLidas() > 0;
        if (!tinhaNaoLidas) return; // nada a fazer, evita SSE desnecessário

        // Confirmação de leitura (visto) no WhatsApp, se habilitado — best-effort.
        configuracaoCrmRepository.findByClienteId(clienteId).ifPresent(config -> {
            if (Boolean.TRUE.equals(config.getEnviarConfirmacaoLeitura())) {
                mensagemRepository
                        .findTopByAtendimento_IdAndDirecaoOrderByDataMensagemDesc(id, DirecaoMensagem.RECEBIDA)
                        .filter(m -> m.getEvolutionMessageId() != null && !m.getEvolutionMessageId().isBlank())
                        .ifPresent(m -> evolutionClient.markMessageAsRead(
                                config.getApiUrl(), config.getInstanceName(), config.getApiKey(),
                                atendimento.getNumero() + "@s.whatsapp.net",
                                m.getEvolutionMessageId(), false));
            }
        });

        atendimento.setMensagensNaoLidas(0);
        Atendimento salvo = atendimentoRepository.save(atendimento);
        sseService.emit(clienteId, "atendimento-atualizado", AtendimentoMapper.toDto(salvo));
        log.debug("Atendimento {} marcado como lido", id);
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
