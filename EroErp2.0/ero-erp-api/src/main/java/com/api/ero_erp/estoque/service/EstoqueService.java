package com.api.ero_erp.estoque.service;

import com.api.ero_erp.config.PageableUtils;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.estoque.dtos.AjusteDto;
import com.api.ero_erp.estoque.dtos.EntradaDto;
import com.api.ero_erp.estoque.dtos.EstoqueCreateDto;
import com.api.ero_erp.estoque.dtos.EstoqueMovimentavelDto;
import com.api.ero_erp.estoque.dtos.EstoqueResponseDto;
import com.api.ero_erp.estoque.dtos.EstoqueUpdateDto;
import com.api.ero_erp.estoque.dtos.MovimentacaoResponseDto;
import com.api.ero_erp.estoque.dtos.TransferenciaDto;
import com.api.ero_erp.estoque.entity.Estoque;
import com.api.ero_erp.estoque.entity.EstoqueMovimentacao;
import com.api.ero_erp.estoque.enums.TipoMovimentacao;
import com.api.ero_erp.estoque.mapper.EstoqueMapper;
import com.api.ero_erp.estoque.repository.EstoqueMovimentacaoRepository;
import com.api.ero_erp.estoque.repository.EstoqueRepository;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.exceptions.SaldoInsuficienteException;
import com.api.ero_erp.filial.entity.Filial;
import com.api.ero_erp.filial.service.FilialService;
import com.api.ero_erp.produto.entity.Produto;
import com.api.ero_erp.produto.service.ProdutoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Estoque de produto, por filial — e o preço de venda dele ali. Ver docs/11.
 *
 * <p>Toda movimentação segue o mesmo caminho: trava a linha
 * ({@code SELECT … FOR UPDATE}), confere que ela se movimenta, muda o saldo e
 * grava o movimento com a quantidade <b>com sinal</b>. A linha sem controle
 * de estoque guarda preço e situação, mas não se movimenta.
 *
 * <p>Logs levam só id e operação (regra 5 do CLAUDE.md).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EstoqueService {

    private static final String SALDO_INICIAL = "Saldo inicial";

    private final EstoqueRepository estoqueRepository;
    private final EstoqueMovimentacaoRepository movimentacaoRepository;
    private final ProdutoService produtoService;
    private final FilialService filialService;
    private final SecurityUtils securityUtils;

    // ─── Consulta ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<EstoqueResponseDto> getAll(Pageable pageable, String termo, UUID filialId, UUID produtoId,
                                           Boolean controla, Boolean ativo) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        String texto = textoOuNulo(termo);
        Page<UUID> ids = estoqueRepository.findIdsWithFilters(PageableUtils.semOrdenacao(pageable), tenantId,
                texto, codigoOuNulo(texto), filialId, produtoId, controla, ativo);
        List<EstoqueResponseDto> linhas = carregarNaOrdem(ids.getContent(), tenantId).stream()
                .map(EstoqueMapper::toResponse)
                .toList();
        return new PageImpl<>(linhas, ids.getPageable(), ids.getTotalElements());
    }

    /** O combo das movimentações: o que se movimenta numa filial. */
    @Transactional(readOnly = true)
    public List<EstoqueMovimentavelDto> movimentaveis(UUID filialId, String termo) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        String texto = textoOuNulo(termo);
        List<UUID> ids = estoqueRepository.findIdsMovimentaveis(tenantId, filialId, texto, codigoOuNulo(texto));
        return carregarNaOrdem(ids, tenantId).stream()
                .map(EstoqueMapper::toMovimentavel)
                .toList();
    }

    /** O combo de produtos da consulta: o que tem linha ativa na filial, controlando estoque ou não. */
    @Transactional(readOnly = true)
    public List<Estoque> daFilial(UUID filialId, String termo) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        String texto = textoOuNulo(termo);
        return carregarNaOrdem(estoqueRepository.findIdsDaFilial(tenantId, filialId, texto, codigoOuNulo(texto)),
                tenantId);
    }

    @Transactional(readOnly = true)
    public EstoqueResponseDto findByIdResponse(UUID id) {
        return EstoqueMapper.toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public Estoque findById(UUID id) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        return estoqueRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new NotFoundException("Estoque não encontrado"));
    }

    @Transactional(readOnly = true)
    public Page<MovimentacaoResponseDto> movimentacoes(Pageable pageable, UUID estoqueId, UUID filialId,
                                                       UUID produtoId, TipoMovimentacao tipo,
                                                       Instant de, Instant ate) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        Page<UUID> ids = movimentacaoRepository.findIdsWithFilters(PageableUtils.semOrdenacao(pageable), tenantId,
                estoqueId, filialId, produtoId, tipo != null ? tipo.name() : null, de, ate);
        List<MovimentacaoResponseDto> linhas = carregarMovimentosNaOrdem(ids.getContent(), tenantId).stream()
                .map(EstoqueMapper::toResponse)
                .toList();
        return new PageImpl<>(linhas, ids.getPageable(), ids.getTotalElements());
    }

    // ─── Cadastro ─────────────────────────────────────────────────────────

    @Transactional
    public EstoqueResponseDto create(EstoqueCreateDto dto) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        Produto produto = produtoService.findById(dto.produtoId());
        Filial filial = filialService.findById(dto.filialId());
        if (!Boolean.TRUE.equals(produto.getAtivo())) {
            throw new ConflictException("O produto " + produto.getNome() + " está inativo. Reative-o antes");
        }
        exigirFilialAtiva(filial);
        // Produto e filial já conferidos no tenant: só então se pergunta pela
        // linha — no antigo a pergunta vinha antes, sem tenant, e respondia
        // sobre o estoque de outro cliente.
        if (estoqueRepository.findIdByProdutoAndFilial(produto.getId(), filial.getId(), tenantId).isPresent()) {
            throw new ConflictException("O produto " + produto.getNome() + " já tem estoque na filial "
                    + nomeDe(filial));
        }
        BigDecimal inicial = dto.quantidadeInicial();
        boolean comSaldoInicial = inicial != null && inicial.signum() > 0;
        if (comSaldoInicial && !Boolean.TRUE.equals(dto.controlaEstoque())) {
            throw new BadRequestException("Sem controle de estoque não há quantidade inicial");
        }

        Estoque estoque = new Estoque();
        estoque.setTenant(securityUtils.getTenantReference());
        estoque.setProduto(produto);
        estoque.setFilial(filial);
        estoque.setPrecoVenda(dto.precoVenda());
        estoque.setControlaEstoque(dto.controlaEstoque());
        estoque.setQuantidadeMinima(dto.quantidadeMinima());
        estoque.setCreatedBy(securityUtils.getUsuarioLogado());
        Estoque salvo = estoqueRepository.save(estoque);

        if (comSaldoInicial) {
            movimentar(salvo, TipoMovimentacao.ENTRADA, inicial, SALDO_INICIAL, null, null, null);
        }

        log.info("Estoque criado id={}", salvo.getId());
        return EstoqueMapper.toResponse(salvo);
    }

    /** Não toca na quantidade. */
    @Transactional
    public EstoqueResponseDto update(UUID id, EstoqueUpdateDto dto) {
        Estoque estoque = findById(id);
        estoque.setPrecoVenda(dto.precoVenda());
        estoque.setControlaEstoque(dto.controlaEstoque());
        estoque.setQuantidadeMinima(dto.quantidadeMinima());
        estoque.setUpdatedBy(securityUtils.getUsuarioLogado());

        log.info("Estoque alterado id={}", id);
        return EstoqueMapper.toResponse(estoqueRepository.saveAndFlush(estoque));
    }

    @Transactional
    public EstoqueResponseDto alterarAtivo(UUID id, boolean ativo) {
        Estoque estoque = findById(id);
        estoque.setAtivo(ativo);
        estoque.setUpdatedBy(securityUtils.getUsuarioLogado());

        log.info("Estoque {} alterado para ativo={}", id, ativo);
        return EstoqueMapper.toResponse(estoqueRepository.saveAndFlush(estoque));
    }

    // ─── Movimentação ─────────────────────────────────────────────────────

    @Transactional
    public MovimentacaoResponseDto entrada(UUID id, EntradaDto dto) {
        Estoque estoque = travar(id);
        exigirMovimentavel(estoque);

        EstoqueMovimentacao movimento = movimentar(estoque, TipoMovimentacao.ENTRADA, dto.quantidade(),
                textoOuNulo(dto.motivo()), null, null, null);
        log.info("Entrada no estoque id={} movimento={}", id, movimento.getId());
        return EstoqueMapper.toResponse(movimento);
    }

    /** Quem contou diz quanto há; o movimento grava a diferença com o sinal dela. */
    @Transactional
    public MovimentacaoResponseDto ajuste(UUID id, AjusteDto dto) {
        Estoque estoque = travar(id);
        exigirMovimentavel(estoque);

        BigDecimal diferenca = dto.quantidadeNova().subtract(estoque.getQuantidade());
        if (diferenca.signum() == 0) {
            throw new BadRequestException("A quantidade nova é igual à atual: não há o que ajustar");
        }
        EstoqueMovimentacao movimento = movimentar(estoque, TipoMovimentacao.AJUSTE, diferenca,
                dto.motivo().trim(), null, null, null);
        log.info("Ajuste no estoque id={} movimento={}", id, movimento.getId());
        return EstoqueMapper.toResponse(movimento);
    }

    /**
     * Dois movimentos, um em cada filial, com o mesmo {@code transferenciaId}.
     * As duas linhas são travadas em ordem de id — duas transferências
     * cruzadas (A→B e B→A) travariam uma à outra se cada uma começasse pela
     * sua origem.
     *
     * @return os dois movimentos: a saída e depois a entrada
     */
    @Transactional
    public List<MovimentacaoResponseDto> transferir(TransferenciaDto dto) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        if (dto.filialOrigemId().equals(dto.filialDestinoId())) {
            throw new BadRequestException("A filial de origem e a de destino são a mesma");
        }
        Produto produto = produtoService.findById(dto.produtoId());
        Filial origem = filialService.findById(dto.filialOrigemId());
        Filial destino = filialService.findById(dto.filialDestinoId());

        UUID idOrigem = estoqueRepository.findIdByProdutoAndFilial(produto.getId(), origem.getId(), tenantId)
                .orElseThrow(() -> new ConflictException("O produto " + produto.getNome()
                        + " não tem estoque na filial " + nomeDe(origem)));
        UUID idDestino = estoqueRepository.findIdByProdutoAndFilial(produto.getId(), destino.getId(), tenantId)
                .orElseGet(() -> abrirLinhaDeDestino(produto, destino));

        boolean origemPrimeiro = idOrigem.compareTo(idDestino) < 0;
        Estoque primeira = travar(origemPrimeiro ? idOrigem : idDestino);
        Estoque segunda = travar(origemPrimeiro ? idDestino : idOrigem);
        Estoque linhaOrigem = origemPrimeiro ? primeira : segunda;
        Estoque linhaDestino = origemPrimeiro ? segunda : primeira;

        exigirMovimentavel(linhaOrigem);
        exigirMovimentavel(linhaDestino);
        if (linhaOrigem.getQuantidade().compareTo(dto.quantidade()) < 0) {
            throw new SaldoInsuficienteException("Saldo insuficiente na filial " + nomeDe(origem) + ": há "
                    + linhaOrigem.getQuantidade().stripTrailingZeros().toPlainString() + " "
                    + produto.getUnidadeMedida().getSigla());
        }

        UUID transferenciaId = UUID.randomUUID();
        String motivo = textoOuNulo(dto.motivo());
        EstoqueMovimentacao saida = movimentar(linhaOrigem, TipoMovimentacao.TRANSFERENCIA_SAIDA,
                dto.quantidade().negate(), motivo, transferenciaId, destino, null);
        EstoqueMovimentacao entrada = movimentar(linhaDestino, TipoMovimentacao.TRANSFERENCIA_ENTRADA,
                dto.quantidade(), motivo, transferenciaId, origem, null);

        log.info("Transferência {} do estoque {} para {}", transferenciaId, idOrigem, idDestino);
        return List.of(EstoqueMapper.toResponse(saida), EstoqueMapper.toResponse(entrada));
    }

    /**
     * A baixa da consulta concluída: um {@code SAIDA_CONSULTA} negativo na
     * linha do produto na filial do compromisso. Sem controle de estoque a
     * linha não se movimenta e não há o que baixar — devolve vazio.
     *
     * <p>O mesmo caminho das outras movimentações (achar o id → travar →
     * conferir → movimentar). Quem chama baixa os produtos em ordem de id,
     * para duas consultas concluídas juntas não travarem uma à outra, e roda
     * tudo numa transação só: a recusa de um produto desfaz os anteriores.
     */
    @Transactional
    public Optional<EstoqueMovimentacao> saidaPorConsulta(UUID produtoId, UUID filialId, BigDecimal quantidade,
                                                          UUID consultaId) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        Produto produto = produtoService.findById(produtoId);
        Filial filial = filialService.findById(filialId);
        UUID id = estoqueRepository.findIdByProdutoAndFilial(produto.getId(), filial.getId(), tenantId)
                .orElseThrow(() -> new ConflictException(produto.getNome() + " não tem estoque nesta filial"));

        Estoque estoque = travar(id);
        if (!Boolean.TRUE.equals(estoque.getControlaEstoque())) {
            return Optional.empty();
        }
        exigirMovimentavel(estoque);
        if (estoque.getQuantidade().compareTo(quantidade) < 0) {
            throw new SaldoInsuficienteException("Saldo insuficiente de " + produto.getNome() + " na filial "
                    + nomeDe(filial) + ": há " + estoque.getQuantidade().stripTrailingZeros().toPlainString() + " "
                    + produto.getUnidadeMedida().getSigla());
        }

        EstoqueMovimentacao movimento = movimentar(estoque, TipoMovimentacao.SAIDA_CONSULTA, quantidade.negate(),
                "Consulta", null, null, consultaId);
        log.info("Saída por consulta {} no estoque id={} movimento={}", consultaId, id, movimento.getId());
        return Optional.of(movimento);
    }

    /**
     * As linhas de estoque dos produtos numa filial, por produto — para a
     * consulta sugerir o preço e mostrar o saldo. Só leitura: não trava.
     */
    @Transactional(readOnly = true)
    public Map<UUID, Estoque> linhasNaFilial(Collection<UUID> produtoIds, UUID filialId) {
        if (produtoIds.isEmpty()) return Map.of();
        UUID tenantId = securityUtils.getTenantIdLogado();
        return estoqueRepository.findAllDosProdutosNaFilial(produtoIds, filialId, tenantId).stream()
                .collect(Collectors.toMap(e -> e.getProduto().getId(), Function.identity()));
    }

    // ─────────────────────────────────────────────────────────────────────

    /**
     * A filial de destino que ainda não tem o produto ganha a linha: com
     * controle, sem preço. Gravada já, para ser travada como a outra.
     */
    private UUID abrirLinhaDeDestino(Produto produto, Filial destino) {
        exigirFilialAtiva(destino);
        Estoque estoque = new Estoque();
        estoque.setTenant(securityUtils.getTenantReference());
        estoque.setProduto(produto);
        estoque.setFilial(destino);
        estoque.setCreatedBy(securityUtils.getUsuarioLogado());
        Estoque salvo = estoqueRepository.saveAndFlush(estoque);
        log.info("Estoque criado id={} pela transferência", salvo.getId());
        return salvo.getId();
    }

    /** O único lugar onde o saldo muda. */
    private EstoqueMovimentacao movimentar(Estoque estoque, TipoMovimentacao tipo, BigDecimal quantidade,
                                           String motivo, UUID transferenciaId, Filial contraparte,
                                           UUID consultaId) {
        BigDecimal anterior = estoque.getQuantidade();
        BigDecimal posterior = anterior.add(quantidade);
        if (posterior.signum() < 0) {
            // Rede: entrada e transferência já conferem antes, com frase própria
            throw new ConflictException("O saldo não pode ficar negativo");
        }
        estoque.setQuantidade(posterior);
        estoque.setUpdatedBy(securityUtils.getUsuarioLogado());
        estoqueRepository.save(estoque);

        EstoqueMovimentacao movimento = new EstoqueMovimentacao();
        movimento.setTenant(estoque.getTenant());
        movimento.setEstoque(estoque);
        movimento.setTipo(tipo);
        movimento.setQuantidade(quantidade);
        movimento.setQuantidadeAnterior(anterior);
        movimento.setQuantidadePosterior(posterior);
        movimento.setMotivo(motivo);
        movimento.setTransferenciaId(transferenciaId);
        movimento.setFilialContraparte(contraparte);
        movimento.setConsultaId(consultaId);
        movimento.setCreatedBy(securityUtils.getUsuarioLogado());
        return movimentacaoRepository.save(movimento);
    }

    private Estoque travar(UUID id) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        return estoqueRepository.travar(id, tenantId)
                .orElseThrow(() -> new NotFoundException("Estoque não encontrado"));
    }

    /**
     * Toda razão por que uma linha não se movimenta tem a sua frase — a ordem
     * é a do que o usuário resolve primeiro.
     */
    private void exigirMovimentavel(Estoque estoque) {
        Produto produto = estoque.getProduto();
        Filial filial = estoque.getFilial();
        if (!Boolean.TRUE.equals(estoque.getControlaEstoque())) {
            throw new ConflictException("O produto " + produto.getNome() + " não controla estoque na filial "
                    + nomeDe(filial));
        }
        if (!Boolean.TRUE.equals(estoque.getAtivo())) {
            throw new ConflictException("O estoque de " + produto.getNome() + " na filial " + nomeDe(filial)
                    + " está inativo");
        }
        if (!Boolean.TRUE.equals(produto.getAtivo())) {
            throw new ConflictException("O produto " + produto.getNome() + " está inativo");
        }
        exigirFilialAtiva(filial);
    }

    private static void exigirFilialAtiva(Filial filial) {
        if (!Boolean.TRUE.equals(filial.getAtivo())) {
            throw new ConflictException("A filial " + nomeDe(filial) + " está inativa");
        }
    }

    private static String nomeDe(Filial filial) {
        return filial.getPessoa().getNome();
    }

    private List<Estoque> carregarNaOrdem(List<UUID> ids, UUID tenantId) {
        if (ids.isEmpty()) return List.of();
        Map<UUID, Integer> posicao = ids.stream()
                .collect(Collectors.toMap(Function.identity(), ids::indexOf));
        return estoqueRepository.findAllCompletos(ids, tenantId).stream()
                .sorted(Comparator.comparing(e -> posicao.get(e.getId())))
                .toList();
    }

    private List<EstoqueMovimentacao> carregarMovimentosNaOrdem(List<UUID> ids, UUID tenantId) {
        if (ids.isEmpty()) return List.of();
        Map<UUID, Integer> posicao = ids.stream()
                .collect(Collectors.toMap(Function.identity(), ids::indexOf));
        return movimentacaoRepository.findAllCompletos(ids, tenantId).stream()
                .sorted(Comparator.comparing(m -> posicao.get(m.getId())))
                .toList();
    }

    /** O termo como código, quando é só dígitos e cabe num long. */
    private static Long codigoOuNulo(String termo) {
        if (termo == null || !termo.matches("\\d{1,18}")) return null;
        return Long.parseLong(termo);
    }

    private static String textoOuNulo(String valor) {
        return valor != null && !valor.isBlank() ? valor.trim() : null;
    }
}
