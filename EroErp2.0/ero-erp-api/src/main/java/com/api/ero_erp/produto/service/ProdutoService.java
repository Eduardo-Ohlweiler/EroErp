package com.api.ero_erp.produto.service;

import com.api.ero_erp.auxiliarproduto.entity.CategoriaProduto;
import com.api.ero_erp.auxiliarproduto.entity.MarcaProduto;
import com.api.ero_erp.auxiliarproduto.entity.SubgrupoProduto;
import com.api.ero_erp.auxiliarproduto.service.CategoriaProdutoService;
import com.api.ero_erp.auxiliarproduto.service.MarcaProdutoService;
import com.api.ero_erp.auxiliarproduto.service.SubgrupoProdutoService;
import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.catalogo.entity.UnidadeMedida;
import com.api.ero_erp.catalogo.service.CatalogoService;
import com.api.ero_erp.config.PageableUtils;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.produto.dtos.ProdutoRequestDto;
import com.api.ero_erp.produto.dtos.ProdutoResponseDto;
import com.api.ero_erp.produto.dtos.ProdutoSelectDto;
import com.api.ero_erp.produto.entity.Produto;
import com.api.ero_erp.produto.mapper.ProdutoMapper;
import com.api.ero_erp.produto.repository.ProdutoRepository;
import com.api.ero_erp.sequencia.service.SequenciaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Produtos do tenant, sem parte fiscal. O preço de venda é por filial, no
 * estoque. Ver docs/11.
 *
 * <p>O que o produto aponta (unidade, subgrupo, categoria, marca, fornecedor)
 * tem de ser do tenant e estar ativo quando <b>entra</b>; o que já estava
 * continua valendo se for inativado depois — como a filial do serviço.
 *
 * <p>Logs levam só id e operação (regra 5 do CLAUDE.md).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProdutoService {

    /** O tipo de cadastro que faz de uma pessoa um fornecedor (seed da 009). */
    static final String TIPO_FORNECEDOR = "Fornecedor";

    private final ProdutoRepository produtoRepository;
    private final CatalogoService catalogoService;
    private final SubgrupoProdutoService subgrupoService;
    private final CategoriaProdutoService categoriaService;
    private final MarcaProdutoService marcaService;
    private final PessoaService pessoaService;
    private final SequenciaService sequenciaService;
    private final SecurityUtils securityUtils;

    @Transactional(readOnly = true)
    public Page<ProdutoResponseDto> getAll(Pageable pageable, String termo, UUID grupoId, UUID subgrupoId,
                                           UUID categoriaId, UUID marcaId, Boolean ativo) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        String texto = textoOuNulo(termo);
        Page<UUID> ids = produtoRepository.findIdsWithFilters(PageableUtils.semOrdenacao(pageable), tenantId,
                texto, codigoOuNulo(texto), grupoId, subgrupoId, categoriaId, marcaId, ativo);

        List<ProdutoResponseDto> linhas = carregarNaOrdem(ids.getContent(), tenantId).stream()
                .map(ProdutoMapper::toResponse)
                .toList();
        return new PageImpl<>(linhas, ids.getPageable(), ids.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<ProdutoSelectDto> select(String termo) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        String texto = textoOuNulo(termo);
        List<UUID> ids = produtoRepository.findIdsForSelect(tenantId, texto, codigoOuNulo(texto));
        return carregarNaOrdem(ids, tenantId).stream()
                .map(ProdutoMapper::toSelect)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProdutoResponseDto findByIdResponse(UUID id) {
        return ProdutoMapper.toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public Produto findById(UUID id) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        return produtoRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new NotFoundException("Produto não encontrado"));
    }

    @Transactional
    public ProdutoResponseDto create(ProdutoRequestDto dto) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        String nome = dto.nome().trim();
        String ean = textoOuNulo(dto.ean());
        exigirNomeLivre(tenantId, nome, null);
        exigirEanValido(tenantId, ean, null);

        Produto produto = new Produto();
        produto.setTenant(securityUtils.getTenantReference());
        preencher(produto, dto, nome, ean);
        // Por último: o número só sai depois de tudo conferido, e o rollback o
        // devolveria de qualquer jeito (SequenciaService é MANDATORY).
        produto.setCodigo(sequenciaService.proximo(tenantId, SequenciaService.PRODUTO));
        produto.setCreatedBy(securityUtils.getUsuarioLogado());

        Produto salvo = produtoRepository.save(produto);
        log.info("Produto criado id={} codigo={}", salvo.getId(), salvo.getCodigo());
        return ProdutoMapper.toResponse(salvo);
    }

    @Transactional
    public ProdutoResponseDto update(UUID id, ProdutoRequestDto dto) {
        Produto produto = findById(id);
        UUID tenantId = produto.getTenant().getId();
        String nome = dto.nome().trim();
        String ean = textoOuNulo(dto.ean());
        // Antes de mexer na entidade: as natives descarregam a sessão, e um
        // nome repetido já sujo bateria no índice antes da frase.
        exigirNomeLivre(tenantId, nome, id);
        exigirEanValido(tenantId, ean, id);

        preencher(produto, dto, nome, ean);
        produto.setUpdatedBy(securityUtils.getUsuarioLogado());

        log.info("Produto alterado id={}", id);
        return ProdutoMapper.toResponse(produtoRepository.save(produto));
    }

    @Transactional
    public ProdutoResponseDto alterarAtivo(UUID id, boolean ativo) {
        Produto produto = findById(id);
        produto.setAtivo(ativo);
        produto.setUpdatedBy(securityUtils.getUsuarioLogado());

        log.info("Produto {} alterado para ativo={}", id, ativo);
        return ProdutoMapper.toResponse(produtoRepository.save(produto));
    }

    // ─────────────────────────────────────────────────────────────────────

    /**
     * Resolve cada referência comparando com a atual: a que não mudou passa
     * mesmo inativa, a nova tem de estar ativa.
     */
    private void preencher(Produto produto, ProdutoRequestDto dto, String nome, String ean) {
        produto.setUnidadeMedida(resolverUnidade(dto.unidadeMedidaId(), idDe(produto.getUnidadeMedida())));

        SubgrupoProduto subgrupo = dto.subgrupoId() == null ? null
                : subgrupoService.exigirParaVinculo(dto.subgrupoId(), idDe(produto.getSubgrupo()));
        CategoriaProduto categoria = dto.categoriaId() == null ? null
                : categoriaService.exigirParaVinculo(dto.categoriaId(), idDe(produto.getCategoria()));
        MarcaProduto marca = dto.marcaId() == null ? null
                : marcaService.exigirParaVinculo(dto.marcaId(), idDe(produto.getMarca()));
        Pessoa fornecedor = dto.fornecedorId() == null ? null
                : resolverFornecedor(dto.fornecedorId(), idDe(produto.getFornecedor()));

        produto.setNome(nome);
        produto.setDescricao(textoOuNulo(dto.descricao()));
        produto.setEan(ean);
        produto.setSubgrupo(subgrupo);
        produto.setCategoria(categoria);
        produto.setMarca(marca);
        produto.setFornecedor(fornecedor);
        produto.setCusto(dto.custo());
    }

    private UnidadeMedida resolverUnidade(UUID id, UUID idAtual) {
        UnidadeMedida unidade = catalogoService.exigirUnidadeMedida(id);
        if (!Boolean.TRUE.equals(unidade.getAtivo()) && !Objects.equals(id, idAtual)) {
            throw new ConflictException("A unidade " + unidade.getSigla() + " está inativa");
        }
        return unidade;
    }

    /**
     * Pessoa do tenant, cadastrada como fornecedor e ativa. O antigo aceitava
     * qualquer pessoa. Só a que entra é conferida: a que já era fornecedora
     * do produto continua, mesmo que o cadastro dela tenha mudado.
     */
    private Pessoa resolverFornecedor(UUID id, UUID idAtual) {
        Pessoa pessoa = pessoaService.findById(id);
        if (Objects.equals(id, idAtual)) return pessoa;
        if (!Boolean.TRUE.equals(pessoa.getAtivo())) {
            throw new ConflictException("O cadastro de " + pessoa.getNome() + " está inativo. Reative antes de usar como fornecedor");
        }
        boolean fornecedor = pessoa.getTiposCadastro().stream()
                .anyMatch(t -> TIPO_FORNECEDOR.equals(t.getNome()));
        if (!fornecedor) {
            throw new ConflictException(pessoa.getNome() + " não tem o tipo de cadastro Fornecedor");
        }
        return pessoa;
    }

    private void exigirNomeLivre(UUID tenantId, String nome, UUID ignorarId) {
        if (produtoRepository.existeNome(tenantId, nome, ignorarId)) {
            throw new ConflictException("Já existe um produto com o nome \"" + nome + "\"");
        }
    }

    private void exigirEanValido(UUID tenantId, String ean, UUID ignorarId) {
        if (ean == null) return;
        String motivo = Gtin.motivoInvalido(ean);
        if (motivo != null) {
            throw new BadRequestException(motivo);
        }
        produtoRepository.codigoComEan(tenantId, ean, ignorarId).ifPresent(codigo -> {
            throw new ConflictException("O EAN " + ean + " já é do produto " + codigo);
        });
    }

    private List<Produto> carregarNaOrdem(List<UUID> ids, UUID tenantId) {
        if (ids.isEmpty()) return List.of();
        Map<UUID, Integer> posicao = ids.stream()
                .collect(Collectors.toMap(Function.identity(), ids::indexOf));
        return produtoRepository.findAllCompletos(ids, tenantId).stream()
                .sorted(Comparator.comparing(p -> posicao.get(p.getId())))
                .toList();
    }

    private static UUID idDe(BaseEntity entidade) {
        return entidade != null ? entidade.getId() : null;
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
