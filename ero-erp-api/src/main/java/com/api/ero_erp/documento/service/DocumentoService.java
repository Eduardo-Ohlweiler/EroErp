package com.api.ero_erp.documento.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.documento.dtos.DocumentoCreateDto;
import com.api.ero_erp.documento.dtos.DocumentoResponseDto;
import com.api.ero_erp.documento.dtos.DocumentoUpdateDto;
import com.api.ero_erp.documento.entity.Documento;
import com.api.ero_erp.documento.entity.DocumentoStatus;
import com.api.ero_erp.documento.entity.TipoAjuste;
import com.api.ero_erp.documento.mapper.DocumentoMapper;
import com.api.ero_erp.documento.repository.DocumentoRepository;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.emitente.repository.EmitenteRepository;
import com.api.ero_erp.estoque.entity.Estoque;
import com.api.ero_erp.estoque.repository.EstoqueRepository;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.financeiro.formapagamento.repository.FormaPagamentoRepository;
import com.api.ero_erp.modelodocumento.entity.ModeloDocumento;
import com.api.ero_erp.modelodocumento.repository.ModeloDocumentoRepository;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.repository.PessoaRepository;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
@Slf4j
public class DocumentoService {

    private final DocumentoRepository        documentoRepository;
    private final ModeloDocumentoRepository  modeloDocumentoRepository;
    private final EmitenteRepository         emitenteRepository;
    private final PessoaRepository           pessoaRepository;
    private final EstoqueRepository          estoqueRepository;
    private final FormaPagamentoRepository   formaPagamentoRepository;
    private final ClienteService             clienteService;
    private final UsuarioService             usuarioService;
    private final SecurityUtils              securityUtils;
    private final DocumentoTagService        documentoTagService;
    private final DocumentoMapper            documentoMapper;

    public DocumentoService(
            DocumentoRepository       documentoRepository,
            ModeloDocumentoRepository modeloDocumentoRepository,
            EmitenteRepository        emitenteRepository,
            PessoaRepository          pessoaRepository,
            EstoqueRepository         estoqueRepository,
            FormaPagamentoRepository  formaPagamentoRepository,
            ClienteService            clienteService,
            UsuarioService            usuarioService,
            SecurityUtils             securityUtils,
            DocumentoTagService       documentoTagService,
            DocumentoMapper           documentoMapper
    ) {
        this.documentoRepository       = documentoRepository;
        this.modeloDocumentoRepository = modeloDocumentoRepository;
        this.emitenteRepository        = emitenteRepository;
        this.pessoaRepository          = pessoaRepository;
        this.estoqueRepository         = estoqueRepository;
        this.formaPagamentoRepository  = formaPagamentoRepository;
        this.clienteService            = clienteService;
        this.usuarioService            = usuarioService;
        this.securityUtils             = securityUtils;
        this.documentoTagService       = documentoTagService;
        this.documentoMapper           = documentoMapper;
    }

    // ── LEITURA ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Documento findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return documentoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Documento não encontrado, verifique!"));
    }

    @Transactional(readOnly = true)
    public DocumentoResponseDto findByIdResponse(Long id) {
        return documentoMapper.toDto(findById(id));
    }

    @Transactional(readOnly = true)
    public Page<DocumentoResponseDto> getAll(
            Pageable        pageable,
            Long            emitenteId,
            String          clientePessoaNome,
            DocumentoStatus status,
            LocalDate       dataEmissaoInicio,
            LocalDate       dataEmissaoFim
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return documentoRepository.findAllWithFilters(
                        pageable, clienteId, emitenteId, clientePessoaNome, status, dataEmissaoInicio, dataEmissaoFim)
                .map(documentoMapper::toDto);
    }

    // ── ESCRITA ───────────────────────────────────────────────────────────────

    @Transactional
    public DocumentoResponseDto create(DocumentoCreateDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();

        Cliente        cliente        = clienteService.findById(clienteId);
        Usuario        usuario        = usuarioService.findById(securityUtils.getUsuarioIdLogado());
        ModeloDocumento modeloDocumento = findModeloDocumento(dto.modeloDocumentoId(), clienteId);
        Emitente       emitente       = findEmitente(dto.emitenteId(), clienteId);
        Pessoa         clientePessoa  = findPessoa(dto.clientePessoaId(), clienteId);
        Estoque        estoque        = dto.estoqueId() != null ? findEstoque(dto.estoqueId(), clienteId) : null;

        BigDecimal valor     = dto.valor()      != null ? dto.valor()      : BigDecimal.ZERO;
        BigDecimal desconto  = dto.desconto()   != null ? dto.desconto()   : BigDecimal.ZERO;
        BigDecimal acrescimo = dto.acrescimo()  != null ? dto.acrescimo()  : BigDecimal.ZERO;

        TipoAjuste tipoDesc = dto.tipoDesconto()  != null ? dto.tipoDesconto()  : TipoAjuste.VALOR;
        TipoAjuste tipoAcr  = dto.tipoAcrescimo() != null ? dto.tipoAcrescimo() : TipoAjuste.VALOR;

        BigDecimal descontoEfetivo = TipoAjuste.PERCENTUAL.equals(tipoDesc)
                ? valor.multiply(desconto).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : desconto;

        BigDecimal acrescimoEfetivo = TipoAjuste.PERCENTUAL.equals(tipoAcr)
                ? valor.multiply(acrescimo).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : acrescimo;

        Documento documento = new Documento();
        documento.setCliente(cliente);
        documento.setModeloDocumento(modeloDocumento);
        documento.setEmitente(emitente);
        documento.setClientePessoa(clientePessoa);
        documento.setEstoque(estoque);
        documento.setDataEmissao(dto.dataEmissao());
        documento.setValor(dto.valor());
        documento.setDesconto(desconto);
        documento.setTipoDesconto(tipoDesc);
        documento.setAcrescimo(acrescimo);
        documento.setTipoAcrescimo(tipoAcr);
        documento.setValorFinal(valor.subtract(descontoEfetivo).add(acrescimoEfetivo));
        documento.setNumeroParcelas(dto.numeroParcelas() != null ? dto.numeroParcelas() : 1);
        documento.setStatus(DocumentoStatus.RASCUNHO);
        documento.setObservacoes(dto.observacoes());
        documento.setCreatedBy(usuario);

        if (dto.formaPagamentoId() != null) {
            formaPagamentoRepository.findById(dto.formaPagamentoId())
                    .ifPresent(documento::setFormaPagamento);
        }

        documento = documentoRepository.save(documento);

        String conteudoGerado = documentoTagService.processarTags(modeloDocumento.getConteudo(), documento);
        documento.setConteudoGerado(conteudoGerado);
        documento = documentoRepository.save(documento);

        log.info("Documento {} criado para cliente {}", documento.getId(), clienteId);
        return documentoMapper.toDto(documento);
    }

    @Transactional
    public DocumentoResponseDto update(Long id, DocumentoUpdateDto dto) {
        Long      clienteId = securityUtils.getClienteIdLogado();
        Documento documento = documentoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Documento não encontrado, verifique!"));
        Usuario   usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (dto.modeloDocumentoId() != null) {
            documento.setModeloDocumento(findModeloDocumento(dto.modeloDocumentoId(), clienteId));
        }
        if (dto.emitenteId() != null) {
            documento.setEmitente(findEmitente(dto.emitenteId(), clienteId));
        }
        if (dto.clientePessoaId() != null) {
            documento.setClientePessoa(findPessoa(dto.clientePessoaId(), clienteId));
        }
        if (dto.estoqueId() != null) {
            documento.setEstoque(findEstoque(dto.estoqueId(), clienteId));
        }
        if (dto.dataEmissao()    != null) documento.setDataEmissao(dto.dataEmissao());
        if (dto.valor()          != null) documento.setValor(dto.valor());
        if (dto.desconto()       != null) documento.setDesconto(dto.desconto());
        if (dto.tipoDesconto()   != null) documento.setTipoDesconto(dto.tipoDesconto());
        if (dto.acrescimo()      != null) documento.setAcrescimo(dto.acrescimo());
        if (dto.tipoAcrescimo()  != null) documento.setTipoAcrescimo(dto.tipoAcrescimo());
        if (dto.numeroParcelas() != null) documento.setNumeroParcelas(dto.numeroParcelas());
        if (dto.observacoes()    != null) documento.setObservacoes(dto.observacoes());

        if (dto.formaPagamentoId() != null) {
            formaPagamentoRepository.findById(dto.formaPagamentoId())
                    .ifPresent(documento::setFormaPagamento);
        }

        BigDecimal valor     = documento.getValor()     != null ? documento.getValor()     : BigDecimal.ZERO;
        BigDecimal desconto  = documento.getDesconto()  != null ? documento.getDesconto()  : BigDecimal.ZERO;
        BigDecimal acrescimo = documento.getAcrescimo() != null ? documento.getAcrescimo() : BigDecimal.ZERO;

        TipoAjuste tipoDesc = documento.getTipoDesconto()  != null ? documento.getTipoDesconto()  : TipoAjuste.VALOR;
        TipoAjuste tipoAcr  = documento.getTipoAcrescimo() != null ? documento.getTipoAcrescimo() : TipoAjuste.VALOR;

        BigDecimal descontoEfetivo = TipoAjuste.PERCENTUAL.equals(tipoDesc)
                ? valor.multiply(desconto).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : desconto;

        BigDecimal acrescimoEfetivo = TipoAjuste.PERCENTUAL.equals(tipoAcr)
                ? valor.multiply(acrescimo).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : acrescimo;

        documento.setValorFinal(valor.subtract(descontoEfetivo).add(acrescimoEfetivo));

        String conteudoGerado = documentoTagService.processarTags(
                documento.getModeloDocumento().getConteudo(), documento);
        documento.setConteudoGerado(conteudoGerado);
        documento.setUpdatedBy(usuario);

        documento = documentoRepository.save(documento);
        log.info("Documento {} atualizado pelo cliente {}", id, clienteId);
        return documentoMapper.toDto(documento);
    }

    @Transactional
    public DocumentoResponseDto emitir(Long id) {
        Long      clienteId = securityUtils.getClienteIdLogado();
        Documento documento = documentoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Documento não encontrado, verifique!"));
        Usuario   usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (documento.getStatus() != DocumentoStatus.RASCUNHO) {
            throw new BadRequestException("Documento não pode ser emitido pois está com status " + documento.getStatus() + ", verifique!");
        }

        documento.setStatus(DocumentoStatus.EMITIDO);
        documento.setUpdatedBy(usuario);
        documento = documentoRepository.save(documento);
        log.info("Documento {} emitido pelo cliente {}", id, clienteId);
        return documentoMapper.toDto(documento);
    }

    @Transactional
    public DocumentoResponseDto cancelar(Long id) {
        Long      clienteId = securityUtils.getClienteIdLogado();
        Documento documento = documentoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Documento não encontrado, verifique!"));
        Usuario   usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (documento.getStatus() == DocumentoStatus.CANCELADO) {
            throw new BadRequestException("Documento já está cancelado, verifique!");
        }

        documento.setStatus(DocumentoStatus.CANCELADO);
        documento.setUpdatedBy(usuario);
        documento = documentoRepository.save(documento);
        log.info("Documento {} cancelado pelo cliente {}", id, clienteId);
        return documentoMapper.toDto(documento);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    private ModeloDocumento findModeloDocumento(Long id, Long clienteId) {
        return modeloDocumentoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Modelo de documento não encontrado, verifique!"));
    }

    private Emitente findEmitente(Long id, Long clienteId) {
        return emitenteRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Emitente não encontrado, verifique!"));
    }

    private Pessoa findPessoa(Long id, Long clienteId) {
        return pessoaRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Pessoa não encontrada, verifique!"));
    }

    private Estoque findEstoque(Long id, Long clienteId) {
        return estoqueRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Estoque não encontrado, verifique!"));
    }
}
