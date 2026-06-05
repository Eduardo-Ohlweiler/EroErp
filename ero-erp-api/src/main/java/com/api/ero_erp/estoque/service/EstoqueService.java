package com.api.ero_erp.estoque.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.emitente.repository.EmitenteRepository;
import com.api.ero_erp.estoque.dtos.*;
import java.util.List;
import com.api.ero_erp.estoque.entity.Estoque;
import com.api.ero_erp.estoque.entity.EstoqueMovimentacao;
import com.api.ero_erp.estoque.entity.EstoqueTransferencia;
import com.api.ero_erp.estoque.enums.TipoMovimentacao;
import com.api.ero_erp.estoque.mapper.EstoqueMapper;
import com.api.ero_erp.estoque.repository.EstoqueMovimentacaoRepository;
import com.api.ero_erp.estoque.repository.EstoqueRepository;
import com.api.ero_erp.estoque.repository.EstoqueTransferenciaRepository;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.produto.entity.Produto;
import com.api.ero_erp.produto.repository.ProdutoRepository;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class EstoqueService {

    private final EstoqueRepository              estoqueRepository;
    private final EstoqueMovimentacaoRepository  movimentacaoRepository;
    private final EstoqueTransferenciaRepository transferenciaRepository;
    private final EmitenteRepository             emitenteRepository;
    private final ProdutoRepository              produtoRepository;
    private final ClienteService                 clienteService;
    private final UsuarioService                 usuarioService;
    private final EstoqueMapper                  estoqueMapper;
    private final SecurityUtils                  securityUtils;

    public EstoqueService(
            EstoqueRepository              estoqueRepository,
            EstoqueMovimentacaoRepository  movimentacaoRepository,
            EstoqueTransferenciaRepository transferenciaRepository,
            EmitenteRepository             emitenteRepository,
            ProdutoRepository              produtoRepository,
            ClienteService                 clienteService,
            UsuarioService                 usuarioService,
            EstoqueMapper                  estoqueMapper,
            SecurityUtils                  securityUtils
    ) {
        this.estoqueRepository       = estoqueRepository;
        this.movimentacaoRepository  = movimentacaoRepository;
        this.transferenciaRepository = transferenciaRepository;
        this.emitenteRepository      = emitenteRepository;
        this.produtoRepository       = produtoRepository;
        this.clienteService          = clienteService;
        this.usuarioService          = usuarioService;
        this.estoqueMapper           = estoqueMapper;
        this.securityUtils           = securityUtils;
    }

    // ── ESTOQUE ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Estoque findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return estoqueRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Estoque não encontrado"));
    }

    @Transactional(readOnly = true)
    public EstoqueResponseDto findByIdResponse(Long id) {
        return estoqueMapper.toDto(findById(id));
    }

    @Transactional(readOnly = true)
    public Page<EstoqueResponseDto> getAll(
            Pageable pageable,
            Long     emitenteId,
            String   produtoNome,
            Boolean  bloqueado
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return estoqueRepository.findAllWithFilters(pageable, clienteId, emitenteId, produtoNome, bloqueado)
                .map(estoqueMapper::toDto);
    }

    @Transactional
    public EstoqueResponseDto create(EstoqueCreateDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();

        if (estoqueRepository.existsByEmitenteIdAndProdutoId(dto.emitenteId(), dto.produtoId())) {
            throw new ConflictException("Já existe um registro de estoque para este produto neste emitente");
        }

        Cliente  cliente  = clienteService.findById(clienteId);
        Usuario  usuario  = usuarioService.findById(securityUtils.getUsuarioIdLogado());
        Emitente emitente = findEmitente(dto.emitenteId(), clienteId);
        Produto  produto  = findProduto(dto.produtoId(), clienteId);

        Estoque estoque = new Estoque();
        estoque.setCliente(cliente);
        estoque.setEmitente(emitente);
        estoque.setProduto(produto);
        estoque.setQuantidade(dto.quantidadeInicial());
        estoque.setPrecoVenda(dto.precoVenda());
        estoque.setQuantidadeMinima(dto.quantidadeMinima());
        estoque.setCustoMedio(produto.getCusto() != null ? produto.getCusto() : BigDecimal.ZERO);
        if (dto.baixarEstoque() != null) estoque.setBaixarEstoque(dto.baixarEstoque());
        estoque.setCreatedBy(usuario);
        estoque = estoqueRepository.save(estoque);

        if (dto.quantidadeInicial().compareTo(BigDecimal.ZERO) > 0) {
            registrarMovimentacao(
                    estoque, cliente, usuario,
                    TipoMovimentacao.ENTRADA,
                    dto.quantidadeInicial(),
                    BigDecimal.ZERO,
                    dto.quantidadeInicial(),
                    dto.motivo(),
                    null
            );
        }

        return estoqueMapper.toDto(estoque);
    }

    @Transactional
    public EstoqueResponseDto update(Long id, EstoqueUpdateDto dto) {
        Estoque estoque = findById(id);
        Usuario usuario = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (dto.precoVenda()       != null) estoque.setPrecoVenda(dto.precoVenda());
        if (dto.bloqueado()        != null) estoque.setBloqueado(dto.bloqueado());
        if (dto.baixarEstoque()    != null) estoque.setBaixarEstoque(dto.baixarEstoque());
        // permite zerar o alerta enviando null explicitamente
        estoque.setQuantidadeMinima(dto.quantidadeMinima());
        estoque.setUpdatedBy(usuario);

        return estoqueMapper.toDto(estoqueRepository.save(estoque));
    }

    // ── AJUSTE ──────────────────────────────────────────────────────────────

    @Transactional
    public MovimentacaoResponseDto ajustar(AjusteCreateDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Estoque estoque   = findById(dto.estoqueId());
        Usuario usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());
        Cliente cliente   = clienteService.findById(clienteId);

        BigDecimal anterior = estoque.getQuantidade();
        BigDecimal nova     = dto.quantidadeNova();
        BigDecimal diff     = nova.subtract(anterior).abs();

        estoque.setQuantidade(nova);
        estoque.setUpdatedBy(usuario);
        estoqueRepository.save(estoque);

        EstoqueMovimentacao mov = registrarMovimentacao(
                estoque, cliente, usuario,
                TipoMovimentacao.AJUSTE,
                diff,
                anterior,
                nova,
                dto.motivo(),
                null
        );

        return estoqueMapper.toMovDto(mov);
    }

    // ── TRANSFERÊNCIA ────────────────────────────────────────────────────────

    @Transactional
    public TransferenciaResponseDto transferir(TransferenciaCreateDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = clienteService.findById(clienteId);
        Usuario usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());
        Produto produto   = findProduto(dto.produtoId(), clienteId);

        if (dto.emitenteOrigemId().equals(dto.emitenteDestinoId())) {
            throw new ConflictException("Emitente de origem e destino devem ser diferentes");
        }

        Emitente emitenteOrigem  = findEmitente(dto.emitenteOrigemId(), clienteId);
        Emitente emitenteDestino = findEmitente(dto.emitenteDestinoId(), clienteId);

        Estoque origem = estoqueRepository.findByEmitenteIdAndProdutoId(dto.emitenteOrigemId(), dto.produtoId())
                .orElseThrow(() -> new NotFoundException("Estoque de origem não encontrado para este produto"));

        if (origem.getQuantidade().compareTo(dto.quantidade()) < 0) {
            throw new ConflictException("Saldo insuficiente no estoque de origem. Disponível: " + origem.getQuantidade());
        }

        Estoque destino = estoqueRepository.findByEmitenteIdAndProdutoId(dto.emitenteDestinoId(), dto.produtoId())
                .orElseGet(() -> criarEstoqueVazio(cliente, emitenteDestino, produto, usuario));

        EstoqueTransferencia transferencia = new EstoqueTransferencia();
        transferencia.setCliente(cliente);
        transferencia.setProduto(produto);
        transferencia.setEmitenteOrigem(emitenteOrigem);
        transferencia.setEmitenteDestino(emitenteDestino);
        transferencia.setQuantidade(dto.quantidade());
        transferencia.setObservacao(dto.observacao());
        transferencia.setCreatedBy(usuario);
        transferencia = transferenciaRepository.save(transferencia);

        BigDecimal qtdOrigAnterior = origem.getQuantidade();
        BigDecimal qtdOrigPosterior = qtdOrigAnterior.subtract(dto.quantidade());
        origem.setQuantidade(qtdOrigPosterior);
        origem.setUpdatedBy(usuario);
        estoqueRepository.save(origem);

        BigDecimal qtdDestAnterior = destino.getQuantidade();
        BigDecimal qtdDestPosterior = qtdDestAnterior.add(dto.quantidade());
        destino.setQuantidade(qtdDestPosterior);
        destino.setUpdatedBy(usuario);
        estoqueRepository.save(destino);

        registrarMovimentacao(
                origem, cliente, usuario,
                TipoMovimentacao.TRANSFERENCIA_SAIDA,
                dto.quantidade(),
                qtdOrigAnterior,
                qtdOrigPosterior,
                dto.observacao(),
                transferencia
        );

        registrarMovimentacao(
                destino, cliente, usuario,
                TipoMovimentacao.TRANSFERENCIA_ENTRADA,
                dto.quantidade(),
                qtdDestAnterior,
                qtdDestPosterior,
                dto.observacao(),
                transferencia
        );

        return estoqueMapper.toTransfDto(transferencia);
    }

    // ── MOVIMENTAÇÕES ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<MovimentacaoResponseDto> getMovimentacoes(
            Pageable         pageable,
            Long             estoqueId,
            Long             emitenteId,
            TipoMovimentacao tipo
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return movimentacaoRepository.findAllWithFilters(pageable, clienteId, estoqueId, emitenteId, tipo)
                .map(estoqueMapper::toMovDto);
    }

    // ── TRANSFERÊNCIAS ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<TransferenciaResponseDto> getTransferencias(
            Pageable pageable,
            Long     produtoId,
            Long     emitenteId
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return transferenciaRepository.findAllWithFilters(pageable, clienteId, produtoId, emitenteId)
                .map(estoqueMapper::toTransfDto);
    }

    // ── ALERTAS ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<EstoqueAlertaDto> getAlertas() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return estoqueRepository.findAlertas(clienteId)
                .stream()
                .map(estoqueMapper::toAlertaDto)
                .toList();
    }

    // ── HELPERS ──────────────────────────────────────────────────────────────

    private Emitente findEmitente(Long id, Long clienteId) {
        return emitenteRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Emitente não encontrado"));
    }

    private Produto findProduto(Long id, Long clienteId) {
        return produtoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Produto não encontrado"));
    }

    private Estoque criarEstoqueVazio(Cliente cliente, Emitente emitente, Produto produto, Usuario usuario) {
        Estoque e = new Estoque();
        e.setCliente(cliente);
        e.setEmitente(emitente);
        e.setProduto(produto);
        e.setQuantidade(BigDecimal.ZERO);
        e.setCustoMedio(produto.getCusto() != null ? produto.getCusto() : BigDecimal.ZERO);
        e.setCreatedBy(usuario);
        return estoqueRepository.save(e);
    }

    @Transactional(readOnly = true)
    public java.math.BigDecimal getPrecoVenda(Long emitenteId, Long produtoId) {
        return estoqueRepository.findByEmitenteIdAndProdutoId(emitenteId, produtoId)
                .map(e -> e.getPrecoVenda() != null ? e.getPrecoVenda() : java.math.BigDecimal.ZERO)
                .orElse(java.math.BigDecimal.ZERO);
    }

    public void baixarEstoquePorConsumo(
            Long       clienteId,
            Long       emitenteId,
            Long       produtoId,
            BigDecimal quantidade,
            String     motivo,
            Usuario    usuario
    ) {
        Estoque estoque = estoqueRepository.findByEmitenteIdAndProdutoId(emitenteId, produtoId)
                .orElseThrow(() -> new NotFoundException(
                        "Estoque não encontrado para o produto neste emitente"));

        if (!estoque.getCliente().getId().equals(clienteId))
            throw new NotFoundException("Estoque não pertence ao cliente");

        if (Boolean.TRUE.equals(estoque.getBloqueado()))
            throw new BadRequestException("Estoque bloqueado para este produto");

        BigDecimal anterior  = estoque.getQuantidade();
        if (anterior.compareTo(quantidade) < 0)
            throw new BadRequestException(
                    "Quantidade insuficiente no estoque: disponível " + anterior + ", solicitado " + quantidade);

        BigDecimal posterior = anterior.subtract(quantidade);
        estoque.setQuantidade(posterior);
        estoqueRepository.save(estoque);

        registrarMovimentacao(
                estoque, estoque.getCliente(), usuario,
                TipoMovimentacao.SAIDA,
                quantidade, anterior, posterior,
                motivo, null
        );
    }

    private EstoqueMovimentacao registrarMovimentacao(
            Estoque              estoque,
            Cliente              cliente,
            Usuario              usuario,
            TipoMovimentacao     tipo,
            BigDecimal           quantidade,
            BigDecimal           anterior,
            BigDecimal           posterior,
            String               motivo,
            EstoqueTransferencia transferencia
    ) {
        EstoqueMovimentacao m = new EstoqueMovimentacao();
        m.setCliente(cliente);
        m.setEstoque(estoque);
        m.setEmitente(estoque.getEmitente());
        m.setProduto(estoque.getProduto());
        m.setTipo(tipo);
        m.setQuantidade(quantidade);
        m.setQuantidadeAnterior(anterior);
        m.setQuantidadePosterior(posterior);
        m.setMotivo(motivo);
        m.setTransferencia(transferencia);
        m.setCreatedBy(usuario);
        return movimentacaoRepository.save(m);
    }
}
