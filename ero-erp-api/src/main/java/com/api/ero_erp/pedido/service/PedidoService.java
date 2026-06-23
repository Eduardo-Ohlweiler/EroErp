package com.api.ero_erp.pedido.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.emitente.service.EmitenteService;
import com.api.ero_erp.estoque.service.EstoqueService;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.financeiro.contapagar.service.ContaPagarService;
import com.api.ero_erp.financeiro.contareceber.service.ContaReceberService;
import com.api.ero_erp.configuracaopedido.service.ConfiguracaoPedidoService;
import com.api.ero_erp.credito.service.CreditoClienteService;
import com.api.ero_erp.pedido.dtos.DevolverPedidoDto;
import com.api.ero_erp.pedido.dtos.PedidoCreateDto;
import com.api.ero_erp.pedido.dtos.PedidoProdutoCreateDto;
import com.api.ero_erp.pedido.dtos.PedidoProdutoResponseDto;
import com.api.ero_erp.pedido.dtos.PedidoResponseDto;
import com.api.ero_erp.pedido.dtos.PedidoUpdateDto;
import com.api.ero_erp.pedido.entity.Pedido;
import com.api.ero_erp.pedido.entity.PedidoProduto;
import com.api.ero_erp.pedido.entity.TipoPedido;
import com.api.ero_erp.pedido.enums.MovimentaEstoque;
import com.api.ero_erp.pedido.enums.GeraFinanceiro;
import com.api.ero_erp.pedido.enums.StatusPedido;
import com.api.ero_erp.pedido.mapper.PedidoMapper;
import com.api.ero_erp.pedido.repository.PedidoProdutoRepository;
import com.api.ero_erp.pedido.repository.PedidoRepository;
import com.api.ero_erp.pedido.repository.TipoPedidoRepository;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.produto.entity.Produto;
import com.api.ero_erp.produto.repository.ProdutoRepository;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PedidoService {

    private final PedidoRepository        pedidoRepository;
    private final PedidoProdutoRepository pedidoProdutoRepository;
    private final TipoPedidoRepository    tipoPedidoRepository;
    private final ClienteService          clienteService;
    private final EmitenteService         emitenteService;
    private final PessoaService           pessoaService;
    private final UsuarioService          usuarioService;
    private final ProdutoRepository       produtoRepository;
    private final EstoqueService          estoqueService;
    private final ContaReceberService     contaReceberService;
    private final ContaPagarService       contaPagarService;
    private final CreditoClienteService     creditoClienteService;
    private final ConfiguracaoPedidoService configuracaoPedidoService;
    private final SecurityUtils           securityUtils;

    public PedidoService(
            PedidoRepository        pedidoRepository,
            PedidoProdutoRepository pedidoProdutoRepository,
            TipoPedidoRepository    tipoPedidoRepository,
            ClienteService          clienteService,
            EmitenteService         emitenteService,
            PessoaService           pessoaService,
            UsuarioService          usuarioService,
            ProdutoRepository       produtoRepository,
            EstoqueService          estoqueService,
            ContaReceberService     contaReceberService,
            ContaPagarService       contaPagarService,
            CreditoClienteService     creditoClienteService,
            ConfiguracaoPedidoService configuracaoPedidoService,
            SecurityUtils           securityUtils
    ) {
        this.pedidoRepository        = pedidoRepository;
        this.pedidoProdutoRepository = pedidoProdutoRepository;
        this.tipoPedidoRepository    = tipoPedidoRepository;
        this.clienteService          = clienteService;
        this.emitenteService         = emitenteService;
        this.pessoaService           = pessoaService;
        this.usuarioService          = usuarioService;
        this.produtoRepository       = produtoRepository;
        this.estoqueService          = estoqueService;
        this.contaReceberService     = contaReceberService;
        this.contaPagarService       = contaPagarService;
        this.creditoClienteService     = creditoClienteService;
        this.configuracaoPedidoService = configuracaoPedidoService;
        this.securityUtils           = securityUtils;
    }

    // ── Pedidos ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Pedido findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return pedidoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Pedido não encontrado"));
    }

    @Transactional(readOnly = true)
    public PedidoResponseDto findByIdResponse(Long id) {
        return buildResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public Page<PedidoResponseDto> getAll(
            Pageable      pageable,
            StatusPedido  status,
            Long          emitenteId,
            Long          pessoaId,
            Long          tipoPedidoId,
            LocalDateTime inicio,
            LocalDateTime fim,
            String        nomePessoa,
            Boolean       faturado
    ) {
        Long          clienteId   = securityUtils.getClienteIdLogado();
        LocalDateTime inicioFinal = (inicio != null) ? inicio : LocalDateTime.of(1900, 1, 1, 0, 0);
        LocalDateTime fimFinal    = (fim    != null) ? fim    : LocalDateTime.of(2100, 12, 31, 23, 59, 59);
        return pedidoRepository.findAllWithFilters(
                pageable, clienteId, status, emitenteId, pessoaId, tipoPedidoId, inicioFinal, fimFinal, nomePessoa, faturado
        ).map(this::buildResponse);
    }

    @Transactional
    public PedidoResponseDto create(PedidoCreateDto dto) {
        Long       clienteId = securityUtils.getClienteIdLogado();
        Cliente    cliente   = clienteService.findById(clienteId);
        Usuario    usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());
        Emitente   emitente  = emitenteService.findById(dto.emitenteId());
        Pessoa     pessoa    = pessoaService.findById(dto.pessoaId());
        TipoPedido tipo      = tipoPedidoRepository.findByIdAndClienteId(dto.tipoPedidoId(), clienteId)
                .orElseThrow(() -> new NotFoundException("Tipo de pedido não encontrado"));
        Usuario    vendedor  = (dto.vendedorId() != null)
                ? usuarioService.findById(dto.vendedorId())
                : usuario;

        Pedido pedido = new Pedido();
        pedido.setCliente(cliente);
        pedido.setEmitente(emitente);
        pedido.setPessoa(pessoa);
        pedido.setTipoPedido(tipo);
        pedido.setVendedor(vendedor);
        pedido.setStatus(StatusPedido.ABERTO);
        pedido.setDataPedido(dto.dataPedido());
        pedido.setDataEntrega(dto.dataEntrega());
        pedido.setObservacao(dto.observacao());
        pedido.setCreatedBy(usuario);
        pedidoRepository.save(pedido);

        if (dto.produtos() != null) {
            for (PedidoProdutoCreateDto p : dto.produtos()) {
                criarProduto(pedido, p, cliente, usuario);
            }
        }

        return buildResponse(pedido);
    }

    @Transactional
    public PedidoResponseDto update(Long id, PedidoUpdateDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Pedido  pedido    = findById(id);
        Usuario usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        validarEdicao(pedido);

        Emitente   emitente = emitenteService.findById(dto.emitenteId());
        Pessoa     pessoa   = pessoaService.findById(dto.pessoaId());
        TipoPedido tipo     = tipoPedidoRepository.findByIdAndClienteId(dto.tipoPedidoId(), clienteId)
                .orElseThrow(() -> new NotFoundException("Tipo de pedido não encontrado"));

        pedido.setEmitente(emitente);
        pedido.setPessoa(pessoa);
        pedido.setTipoPedido(tipo);
        if (dto.vendedorId() != null)
            pedido.setVendedor(usuarioService.findById(dto.vendedorId()));
        pedido.setDataPedido(dto.dataPedido());
        pedido.setDataEntrega(dto.dataEntrega());
        pedido.setObservacao(dto.observacao());
        pedido.setTipoAjusteGeral(dto.tipoAjusteGeral());
        pedido.setTipoCalculoGeral(dto.tipoCalculoGeral());
        pedido.setValorAjusteGeral(dto.valorAjusteGeral());
        pedido.setUpdatedBy(usuario);

        return buildResponse(pedidoRepository.save(pedido));
    }

    @Transactional
    public PedidoResponseDto concluir(Long id) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Pedido  pedido    = findById(id);
        Usuario usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (pedido.getStatus() == StatusPedido.CONCLUIDO)
            throw new BadRequestException("Pedido já está concluído");
        if (pedido.getStatus() == StatusPedido.CANCELADO)
            throw new BadRequestException("Não é possível concluir um pedido cancelado");
        if (pedido.getStatus() == StatusPedido.DEVOLVIDO || pedido.getStatus() == StatusPedido.DEVOLVIDO_PARCIAL)
            throw new BadRequestException("Não é possível concluir um pedido devolvido");

        aplicarConclusao(pedido, clienteId, usuario);
        pedido.setUpdatedBy(usuario);

        return buildResponse(pedidoRepository.save(pedido));
    }

    @Transactional
    public PedidoResponseDto faturar(Long id, Long contaId, BigDecimal creditoUtilizado) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Pedido  pedido    = findById(id);
        Usuario usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (pedido.getStatus() == StatusPedido.CANCELADO)
            throw new BadRequestException("Não é possível faturar um pedido cancelado");
        if (pedido.getStatus() == StatusPedido.DEVOLVIDO || pedido.getStatus() == StatusPedido.DEVOLVIDO_PARCIAL)
            throw new BadRequestException("Não é possível faturar um pedido devolvido");
        if (pedido.getTipoPedido().getGeraFinanceiro() == GeraFinanceiro.NENHUM)
            throw new BadRequestException("Este tipo de pedido não gera financeiro");
        if (Boolean.TRUE.equals(pedido.getFaturado()))
            throw new BadRequestException("Pedido já está faturado");

        // Se ainda estiver aberto, conclui agora (movimenta estoque + status)
        if (pedido.getStatus() == StatusPedido.ABERTO)
            aplicarConclusao(pedido, clienteId, usuario);

        pedido.setFaturado(true);
        if (contaId != null) pedido.setContaId(contaId);
        pedido.setUpdatedBy(usuario);

        // Consome crédito do cliente, se utilizado no faturamento (não entra no caixa)
        if (creditoUtilizado != null && creditoUtilizado.compareTo(BigDecimal.ZERO) > 0)
            creditoClienteService.usarCredito(pedido.getPessoa(), creditoUtilizado,
                    "Faturamento do pedido #" + id, id, contaId);

        return buildResponse(pedidoRepository.save(pedido));
    }

    @Transactional
    public PedidoResponseDto cancelar(Long id, String motivo) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Pedido  pedido    = findById(id);
        Usuario usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (pedido.getStatus() == StatusPedido.CANCELADO)
            throw new BadRequestException("Pedido já está cancelado");
        if (pedido.getStatus() == StatusPedido.DEVOLVIDO || pedido.getStatus() == StatusPedido.DEVOLVIDO_PARCIAL)
            throw new BadRequestException("Não é possível cancelar um pedido devolvido");

        // Estorna o estoque movimentado na conclusão (inverte a direção do tipo de pedido)
        if (pedido.getStatus() == StatusPedido.CONCLUIDO)
            estornarEstoque(pedido, clienteId, usuario);

        // Exclui o faturamento (conta + parcelas + pagamentos via cascade) se já faturado
        if (Boolean.TRUE.equals(pedido.getFaturado()) && pedido.getContaId() != null) {
            excluirFinanceiro(pedido);
            pedido.setFaturado(false);
            pedido.setContaId(null);
        }

        pedido.setStatus(StatusPedido.CANCELADO);
        pedido.setMotivoCancelamento(motivo);
        pedido.setUpdatedBy(usuario);

        return buildResponse(pedidoRepository.save(pedido));
    }

    /**
     * Devolve produtos do pedido (TOTAL = todo o restante; PARCIAL = quantidades informadas),
     * devolve o estoque correspondente e gera crédito ao cliente quando for venda e a config
     * permitir. Incremental: acumula em quantidadeDevolvida e ajusta o status.
     */
    @Transactional
    public PedidoResponseDto devolver(Long id, DevolverPedidoDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Pedido  pedido    = findById(id);
        Usuario usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (pedido.getStatus() != StatusPedido.CONCLUIDO
                && pedido.getStatus() != StatusPedido.DEVOLVIDO_PARCIAL)
            throw new BadRequestException("Só é possível devolver um pedido concluído");

        List<PedidoProduto> itens = pedidoProdutoRepository.findByPedidoIdAndClienteId(id, clienteId);
        if (itens.isEmpty())
            throw new BadRequestException("Pedido sem produtos para devolver");

        boolean total = "TOTAL".equalsIgnoreCase(dto.tipo());

        // Quantidade a devolver agora por item (pedidoProdutoId -> qtd)
        Map<Long, BigDecimal> aDevolver = new HashMap<>();
        if (total) {
            for (PedidoProduto pp : itens) {
                BigDecimal restante = pp.getQuantidade().subtract(devolvida(pp));
                if (restante.compareTo(BigDecimal.ZERO) > 0) aDevolver.put(pp.getId(), restante);
            }
        } else {
            if (dto.itens() == null || dto.itens().isEmpty())
                throw new BadRequestException("Informe os produtos a devolver");
            Map<Long, PedidoProduto> porId = itens.stream()
                    .collect(Collectors.toMap(PedidoProduto::getId, p -> p));
            for (DevolverPedidoDto.ItemDevolucaoDto it : dto.itens()) {
                if (it.quantidade() == null || it.quantidade().compareTo(BigDecimal.ZERO) <= 0) continue;
                PedidoProduto pp = porId.get(it.pedidoProdutoId());
                if (pp == null)
                    throw new BadRequestException("Produto do pedido não encontrado");
                BigDecimal restante = pp.getQuantidade().subtract(devolvida(pp));
                if (it.quantidade().compareTo(restante) > 0)
                    throw new BadRequestException(
                            "Quantidade a devolver maior que o disponível para o produto " + pp.getProduto().getNome());
                aDevolver.merge(pp.getId(), it.quantidade(), BigDecimal::add);
            }
        }

        if (aDevolver.isEmpty())
            throw new BadRequestException("Nada a devolver");

        // Estorno de estoque (só itens com baixarEstoque = true), pela qtd devolvida agora
        MovimentaEstoque mov = pedido.getTipoPedido().getMovimentaEstoque();
        if (mov == MovimentaEstoque.SAIDA || mov == MovimentaEstoque.ENTRADA) {
            Set<Long> mexeEstoque = pedidoProdutoRepository.findParaMovimentarEstoque(id)
                    .stream().map(PedidoProduto::getId).collect(Collectors.toSet());
            for (PedidoProduto pp : itens) {
                BigDecimal qtd = aDevolver.get(pp.getId());
                if (qtd == null || !mexeEstoque.contains(pp.getId())) continue;
                String motivo = "Devolução do pedido #" + id;
                if (mov == MovimentaEstoque.SAIDA)
                    estoqueService.entrarEstoquePorPedido(clienteId, pp.getEmitente().getId(),
                            pp.getProduto().getId(), qtd, motivo, usuario);
                else
                    estoqueService.baixarEstoquePorConsumo(clienteId, pp.getEmitente().getId(),
                            pp.getProduto().getId(), qtd, motivo, usuario);
            }
        }

        // Valor de venda devolvido (linhas) + crédito rateando o ajuste geral do pedido
        BigDecimal devolvidoLinhas = BigDecimal.ZERO;
        BigDecimal subtotal        = BigDecimal.ZERO;
        for (PedidoProduto pp : itens) {
            subtotal = subtotal.add(PedidoMapper.calcTotal(pp.getPrecoUnitario(), pp.getQuantidade(),
                    pp.getTipoAjuste(), pp.getTipoCalculo(), pp.getValorAjuste()));
            BigDecimal qtd = aDevolver.get(pp.getId());
            if (qtd != null)
                devolvidoLinhas = devolvidoLinhas.add(PedidoMapper.calcTotal(pp.getPrecoUnitario(), qtd,
                        pp.getTipoAjuste(), pp.getTipoCalculo(), pp.getValorAjuste()));
        }
        BigDecimal pedidoTotal = PedidoMapper.calcTotal(subtotal, BigDecimal.ONE,
                pedido.getTipoAjusteGeral(), pedido.getTipoCalculoGeral(), pedido.getValorAjusteGeral());
        BigDecimal creditoValor = subtotal.compareTo(BigDecimal.ZERO) == 0
                ? devolvidoLinhas
                : devolvidoLinhas.multiply(pedidoTotal).divide(subtotal, 2, RoundingMode.HALF_UP);

        // Aplica a devolução nas linhas (qtd acumulada)
        for (PedidoProduto pp : itens) {
            BigDecimal qtd = aDevolver.get(pp.getId());
            if (qtd == null) continue;
            pp.setQuantidadeDevolvida(devolvida(pp).add(qtd));
            pp.setUpdatedBy(usuario);
            pedidoProdutoRepository.save(pp);
        }

        // Crédito só em vendas (CONTAS_RECEBER) e se a config permitir (default SIM)
        if (pedido.getTipoPedido().getGeraFinanceiro() == GeraFinanceiro.CONTAS_RECEBER && devolucaoGeraCredito())
            creditoClienteService.gerarCredito(pedido.getPessoa(), creditoValor,
                    "Devolução do pedido #" + id, id);

        // Status: tudo devolvido => DEVOLVIDO; senão DEVOLVIDO_PARCIAL
        boolean tudoDevolvido = itens.stream()
                .allMatch(pp -> devolvida(pp).compareTo(pp.getQuantidade()) >= 0);
        pedido.setStatus(tudoDevolvido ? StatusPedido.DEVOLVIDO : StatusPedido.DEVOLVIDO_PARCIAL);
        if (dto.motivo() != null && !dto.motivo().isBlank())
            pedido.setMotivoCancelamento(dto.motivo());
        pedido.setUpdatedBy(usuario);

        return buildResponse(pedidoRepository.save(pedido));
    }

    private BigDecimal devolvida(PedidoProduto pp) {
        return pp.getQuantidadeDevolvida() != null ? pp.getQuantidadeDevolvida() : BigDecimal.ZERO;
    }

    private boolean devolucaoGeraCredito() {
        var cfg = configuracaoPedidoService.getAtual();
        return cfg == null
                || cfg.devolucaoGerarCredito() == null
                || !"NAO".equalsIgnoreCase(cfg.devolucaoGerarCredito());
    }

    /**
     * Estorna a movimentação de estoque feita na conclusão: inverte a direção do tipo de
     * pedido (SAIDA → devolve ao estoque; ENTRADA → retira do estoque) — apenas para os
     * produtos cujo cadastro de estoque tem baixarEstoque = true.
     */
    private void estornarEstoque(Pedido pedido, Long clienteId, Usuario usuario) {
        MovimentaEstoque mov = pedido.getTipoPedido().getMovimentaEstoque();
        if (mov == MovimentaEstoque.NENHUM) return;
        List<PedidoProduto> itens = pedidoProdutoRepository.findParaMovimentarEstoque(pedido.getId());
        for (PedidoProduto pp : itens) {
            String motivo = "Estorno (cancelamento) do pedido #" + pedido.getId();
            if (mov == MovimentaEstoque.SAIDA) {
                estoqueService.entrarEstoquePorPedido(
                        clienteId, pp.getEmitente().getId(), pp.getProduto().getId(),
                        pp.getQuantidade(), motivo, usuario);
            } else {
                estoqueService.baixarEstoquePorConsumo(
                        clienteId, pp.getEmitente().getId(), pp.getProduto().getId(),
                        pp.getQuantidade(), motivo, usuario);
            }
        }
    }

    /**
     * Exclui a conta a receber/pagar gerada no faturamento (a cascata remove parcelas e
     * pagamentos). Tolera conta já removida manualmente — o cancelamento prossegue.
     */
    private void excluirFinanceiro(Pedido pedido) {
        GeraFinanceiro gf = pedido.getTipoPedido().getGeraFinanceiro();
        try {
            if (gf == GeraFinanceiro.CONTAS_RECEBER)
                contaReceberService.delete(pedido.getContaId());
            else if (gf == GeraFinanceiro.CONTAS_PAGAR)
                contaPagarService.delete(pedido.getContaId());
        } catch (NotFoundException ignored) {
            // conta já excluída — segue o cancelamento
        }
    }

    /**
     * Conclui o pedido: movimenta o estoque conforme o tipo de pedido
     * (SAIDA baixa, ENTRADA adiciona, NENHUM não mexe) — apenas para produtos
     * cujo cadastro de estoque tem baixarEstoque = true — e marca CONCLUIDO.
     */
    private void aplicarConclusao(Pedido pedido, Long clienteId, Usuario usuario) {
        MovimentaEstoque mov = pedido.getTipoPedido().getMovimentaEstoque();
        if (mov == MovimentaEstoque.SAIDA || mov == MovimentaEstoque.ENTRADA) {
            List<PedidoProduto> itens = pedidoProdutoRepository.findParaMovimentarEstoque(pedido.getId());
            for (PedidoProduto pp : itens) {
                if (mov == MovimentaEstoque.SAIDA) {
                    estoqueService.baixarEstoquePorConsumo(
                            clienteId, pp.getEmitente().getId(), pp.getProduto().getId(),
                            pp.getQuantidade(), "Saída pelo pedido #" + pedido.getId(), usuario);
                } else {
                    estoqueService.entrarEstoquePorPedido(
                            clienteId, pp.getEmitente().getId(), pp.getProduto().getId(),
                            pp.getQuantidade(), "Entrada pelo pedido #" + pedido.getId(), usuario);
                }
            }
        }
        pedido.setStatus(StatusPedido.CONCLUIDO);
    }

    // ── Produtos do pedido ──────────────────────────────────────────────────────

    @Transactional
    public PedidoProdutoResponseDto adicionarProduto(Long pedidoId, PedidoProdutoCreateDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Pedido  pedido    = findById(pedidoId);
        Cliente cliente   = clienteService.findById(clienteId);
        Usuario usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        validarEdicao(pedido);

        return PedidoMapper.toProdutoDto(criarProduto(pedido, dto, cliente, usuario));
    }

    @Transactional
    public PedidoProdutoResponseDto atualizarProduto(Long pedidoId, Long produtoId, PedidoProdutoCreateDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Pedido  pedido    = findById(pedidoId);
        Usuario usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        validarEdicao(pedido);

        PedidoProduto pp = pedidoProdutoRepository
                .findByIdAndPedidoIdAndClienteId(produtoId, pedidoId, clienteId)
                .orElseThrow(() -> new NotFoundException("Produto do pedido não encontrado"));

        Produto  novoProduto = produtoRepository.findByIdAndClienteId(dto.produtoId(), clienteId)
                .orElseThrow(() -> new NotFoundException("Produto não encontrado"));
        Emitente emitente    = emitenteService.findById(dto.emitenteId());

        pp.setProduto(novoProduto);
        pp.setEmitente(emitente);
        pp.setQuantidade(dto.quantidade());
        pp.setPrecoUnitario(dto.precoUnitario());
        pp.setTipoAjuste(dto.tipoAjuste());
        pp.setTipoCalculo(dto.tipoCalculo());
        pp.setValorAjuste(dto.valorAjuste());
        pp.setUpdatedBy(usuario);
        return PedidoMapper.toProdutoDto(pedidoProdutoRepository.save(pp));
    }

    @Transactional
    public void removerProduto(Long pedidoId, Long produtoId) {
        Long   clienteId = securityUtils.getClienteIdLogado();
        Pedido pedido    = findById(pedidoId);

        validarEdicao(pedido);

        PedidoProduto pp = pedidoProdutoRepository
                .findByIdAndPedidoIdAndClienteId(produtoId, pedidoId, clienteId)
                .orElseThrow(() -> new NotFoundException("Produto do pedido não encontrado"));

        pedidoProdutoRepository.delete(pp);
    }

    // ── Auxiliares ────────────────────────────────────────────────────────────

    private PedidoProduto criarProduto(
            Pedido pedido, PedidoProdutoCreateDto dto, Cliente cliente, Usuario usuario
    ) {
        Long clienteId = cliente.getId();
        Produto produto = produtoRepository.findByIdAndClienteId(dto.produtoId(), clienteId)
                .orElseThrow(() -> new NotFoundException("Produto não encontrado"));
        Emitente emitente = emitenteService.findById(dto.emitenteId());

        PedidoProduto pp = new PedidoProduto();
        pp.setCliente(cliente);
        pp.setPedido(pedido);
        pp.setProduto(produto);
        pp.setEmitente(emitente);
        pp.setQuantidade(dto.quantidade());
        pp.setPrecoUnitario(dto.precoUnitario());
        pp.setTipoAjuste(dto.tipoAjuste());
        pp.setTipoCalculo(dto.tipoCalculo());
        pp.setValorAjuste(dto.valorAjuste());
        pp.setCreatedBy(usuario);
        return pedidoProdutoRepository.save(pp);
    }

    private PedidoResponseDto buildResponse(Pedido pedido) {
        Long clienteId = securityUtils.getClienteIdLogado();
        List<PedidoProduto> produtos = pedidoProdutoRepository
                .findByPedidoIdAndClienteId(pedido.getId(), clienteId);
        return PedidoMapper.toDto(pedido, produtos);
    }

    private void validarEdicao(Pedido pedido) {
        if (pedido.getStatus() == StatusPedido.CONCLUIDO)
            throw new BadRequestException("Não é possível editar um pedido já concluído");
        if (pedido.getStatus() == StatusPedido.CANCELADO)
            throw new BadRequestException("Não é possível editar um pedido cancelado");
        if (pedido.getStatus() == StatusPedido.DEVOLVIDO || pedido.getStatus() == StatusPedido.DEVOLVIDO_PARCIAL)
            throw new BadRequestException("Não é possível editar um pedido devolvido");
    }
}
