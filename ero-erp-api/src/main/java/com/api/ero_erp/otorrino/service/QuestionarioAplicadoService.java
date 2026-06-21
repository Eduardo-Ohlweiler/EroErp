package com.api.ero_erp.otorrino.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.clinica.service.ConsultaService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.otorrino.dto.QuestionarioAplicadoCreateDto;
import com.api.ero_erp.otorrino.dto.QuestionarioAplicadoResponseDto;
import com.api.ero_erp.otorrino.dto.QuestionarioAplicadoSummaryDto;
import com.api.ero_erp.otorrino.dto.RespostaDto;
import com.api.ero_erp.otorrino.entity.Questionario;
import com.api.ero_erp.otorrino.entity.QuestionarioAplicado;
import com.api.ero_erp.otorrino.entity.QuestionarioItem;
import com.api.ero_erp.otorrino.entity.QuestionarioResposta;
import com.api.ero_erp.otorrino.mapper.QuestionarioAplicadoMapper;
import com.api.ero_erp.otorrino.repository.QuestionarioAplicadoRepository;
import com.api.ero_erp.otorrino.repository.QuestionarioItemRepository;
import com.api.ero_erp.otorrino.repository.QuestionarioRepository;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class QuestionarioAplicadoService {

    private final QuestionarioAplicadoRepository repository;
    private final QuestionarioRepository         questionarioRepository;
    private final QuestionarioItemRepository      itemRepository;
    private final PessoaService                   pessoaService;
    private final UsuarioService                  usuarioService;
    private final ConsultaService                 consultaService;
    private final SecurityUtils                   securityUtils;

    public QuestionarioAplicadoService(
            QuestionarioAplicadoRepository repository,
            QuestionarioRepository         questionarioRepository,
            QuestionarioItemRepository     itemRepository,
            PessoaService                  pessoaService,
            UsuarioService                 usuarioService,
            ConsultaService                consultaService,
            SecurityUtils                  securityUtils
    ) {
        this.repository             = repository;
        this.questionarioRepository = questionarioRepository;
        this.itemRepository         = itemRepository;
        this.pessoaService          = pessoaService;
        this.usuarioService         = usuarioService;
        this.consultaService        = consultaService;
        this.securityUtils          = securityUtils;
    }

    // ── Leitura ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<QuestionarioAplicadoSummaryDto> getAll(Pageable pageable, Long pessoaId, String codigo) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findAllWithFilters(pageable, clienteId, pessoaId, codigo)
                .map(QuestionarioAplicadoMapper::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public QuestionarioAplicado findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Questionário aplicado não encontrado, verifique!"));
    }

    @Transactional(readOnly = true)
    public QuestionarioAplicadoResponseDto getResponseById(Long id) {
        return QuestionarioAplicadoMapper.toResponseDto(findById(id));
    }

    @Transactional(readOnly = true)
    public List<QuestionarioAplicadoSummaryDto> getByPessoa(Long pessoaId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByPessoaIdAndClienteId(pessoaId, clienteId).stream()
                .map(QuestionarioAplicadoMapper::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<QuestionarioAplicadoSummaryDto> getByConsulta(Long consultaId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByConsultaIdAndClienteId(consultaId, clienteId).stream()
                .map(QuestionarioAplicadoMapper::toSummaryDto)
                .toList();
    }

    // ── Escrita (com scoring) ───────────────────────────────────────────────

    /**
     * Cria uma aplicação de questionário. O scoring (scoreTotal/classificacao/interpretacao)
     * é calculado aqui — esta é a fonte da verdade.
     */
    @Transactional
    public QuestionarioAplicadoResponseDto criar(QuestionarioAplicadoCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();
        Pessoa  pessoa  = pessoaService.findById(dto.pessoaId());

        Long         clienteId    = cliente.getId();
        Questionario questionario = questionarioRepository.findByIdVisivel(dto.questionarioId(), clienteId)
                .orElseThrow(() -> new NotFoundException("Questionário não encontrado, verifique!"));

        if (!questionario.isAtivo()) {
            throw new BadRequestException("Questionário inativo, verifique!");
        }

        // Itens válidos do questionário, indexados por id (para validar respostas).
        Map<Long, QuestionarioItem> itensPorId = itemRepository.findByQuestionarioId(questionario.getId()).stream()
                .collect(Collectors.toMap(QuestionarioItem::getId, Function.identity()));

        QuestionarioAplicado aplicado = new QuestionarioAplicado();
        aplicado.setCliente(cliente);
        aplicado.setPessoa(pessoa);
        aplicado.setUsuario(resolveUsuario());
        aplicado.setConsulta(resolveConsulta(dto.consultaId()));
        aplicado.setQuestionario(questionario);
        aplicado.setDataAplicacao(dto.dataAplicacao());

        int soma = 0;
        for (RespostaDto respostaDto : dto.respostas()) {
            QuestionarioItem item = itensPorId.get(respostaDto.itemId());
            if (item == null) {
                throw new BadRequestException(
                        "Item informado não pertence ao questionário selecionado, verifique!");
            }
            QuestionarioResposta resposta = new QuestionarioResposta();
            resposta.setItem(item);
            resposta.setValor(respostaDto.valor());
            aplicado.addResposta(resposta);

            soma += respostaDto.valor();
        }

        // Scoring — fonte da verdade.
        QuestionarioScoring.Resultado resultado =
                QuestionarioScoring.calcular(questionario.getCodigo(), soma);
        aplicado.setScoreTotal(resultado.scoreTotal());
        aplicado.setClassificacao(resultado.classificacao());
        aplicado.setInterpretacao(resultado.interpretacao());

        return QuestionarioAplicadoMapper.toResponseDto(repository.save(aplicado));
    }

    /**
     * Vincula (ou desvincula, quando {@code consultaId} é nulo) a aplicação a uma consulta.
     */
    @Transactional
    public QuestionarioAplicadoResponseDto vincularConsulta(Long aplicadoId, Long consultaId) {
        Long                 clienteId = securityUtils.getClienteIdLogado();
        QuestionarioAplicado aplicado  = repository.findByIdAndClienteId(aplicadoId, clienteId)
                .orElseThrow(() -> new NotFoundException("Questionário aplicado não encontrado, verifique!"));

        aplicado.setConsulta(resolveConsulta(consultaId));

        return QuestionarioAplicadoMapper.toResponseDto(repository.save(aplicado));
    }

    @Transactional
    public void delete(Long id) {
        Long                 clienteId = securityUtils.getClienteIdLogado();
        QuestionarioAplicado aplicado  = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Questionário aplicado não encontrado, verifique!"));
        repository.delete(aplicado);
    }

    // ── Helpers de carga ──────────────────────────────────────────────────────

    private Usuario resolveUsuario() {
        Long id = securityUtils.getUsuarioIdLogado();
        if (id == null) return null;
        return usuarioService.findByIdAndClienteId(id);
    }

    private Consulta resolveConsulta(Long consultaId) {
        if (consultaId == null) return null;
        // ConsultaService.findById já valida o cliente logado.
        return consultaService.findById(consultaId);
    }
}
