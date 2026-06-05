package com.api.ero_erp.produto.service;

import com.api.ero_erp.categoria.entity.Categoria;
import com.api.ero_erp.categoria.service.CategoriaService;
import com.api.ero_erp.cest.entity.Cest;
import com.api.ero_erp.cest.service.CestService;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.marca.entity.Marca;
import com.api.ero_erp.marca.service.MarcaService;
import com.api.ero_erp.ncm.entity.Ncm;
import com.api.ero_erp.ncm.service.NcmService;
import com.api.ero_erp.origemproduto.entity.OrigemProduto;
import com.api.ero_erp.origemproduto.service.OrigemProdutoService;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.repository.PessoaRepository;
import com.api.ero_erp.produto.dtos.ProdutoCreateDto;
import com.api.ero_erp.produto.dtos.ProdutoResponseDto;
import com.api.ero_erp.produto.dtos.ProdutoUpdateDto;
import com.api.ero_erp.produto.entity.Produto;
import com.api.ero_erp.produto.mapper.ProdutoMapper;
import com.api.ero_erp.produto.repository.ProdutoRepository;
import com.api.ero_erp.subgrupo.entity.Subgrupo;
import com.api.ero_erp.subgrupo.service.SubgrupoService;
import com.api.ero_erp.tipoproduto.entity.TipoProduto;
import com.api.ero_erp.tipoproduto.service.TipoProdutoService;
import com.api.ero_erp.unidademedida.entity.UnidadeMedida;
import com.api.ero_erp.unidademedida.service.UnidadeMedidaService;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProdutoService {

    private final ProdutoRepository    produtoRepository;
    private final ClienteService       clienteService;
    private final UsuarioService       usuarioService;
    private final TipoProdutoService   tipoProdutoService;
    private final SubgrupoService      subgrupoService;
    private final CategoriaService     categoriaService;
    private final MarcaService         marcaService;
    private final UnidadeMedidaService unidadeMedidaService;
    private final NcmService           ncmService;
    private final OrigemProdutoService origemProdutoService;
    private final CestService          cestService;
    private final PessoaRepository     pessoaRepository;
    private final ProdutoMapper        produtoMapper;
    private final SecurityUtils        securityUtils;

    public ProdutoService(
            ProdutoRepository    produtoRepository,
            ClienteService       clienteService,
            UsuarioService       usuarioService,
            TipoProdutoService   tipoProdutoService,
            SubgrupoService      subgrupoService,
            CategoriaService     categoriaService,
            MarcaService         marcaService,
            UnidadeMedidaService unidadeMedidaService,
            NcmService           ncmService,
            OrigemProdutoService origemProdutoService,
            CestService          cestService,
            PessoaRepository     pessoaRepository,
            ProdutoMapper        produtoMapper,
            SecurityUtils        securityUtils
    ) {
        this.produtoRepository    = produtoRepository;
        this.clienteService       = clienteService;
        this.usuarioService       = usuarioService;
        this.tipoProdutoService   = tipoProdutoService;
        this.subgrupoService      = subgrupoService;
        this.categoriaService     = categoriaService;
        this.marcaService         = marcaService;
        this.unidadeMedidaService = unidadeMedidaService;
        this.ncmService           = ncmService;
        this.origemProdutoService = origemProdutoService;
        this.cestService          = cestService;
        this.pessoaRepository     = pessoaRepository;
        this.produtoMapper        = produtoMapper;
        this.securityUtils        = securityUtils;
    }

    @Transactional(readOnly = true)
    public Produto findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return produtoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Produto não encontrado"));
    }

    @Transactional(readOnly = true)
    public ProdutoResponseDto findByIdResponse(Long id) {
        return produtoMapper.toDto(findById(id));
    }

    @Transactional(readOnly = true)
    public Page<ProdutoResponseDto> getAll(
            Pageable pageable,
            Boolean  bloqueado,
            Long     tipoProdutoId,
            Long     subgrupoId,
            Long     categoriaId,
            Long     marcaId,
            String   nome
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return produtoRepository.findAllWithFilters(
                pageable, clienteId, bloqueado, tipoProdutoId, subgrupoId, categoriaId, marcaId, nome
        ).map(produtoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponseDto> select(Long tipoProdutoId, String classificacao, String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return produtoRepository.findForSelect(clienteId, tipoProdutoId, classificacao, nome)
                .stream()
                .map(produtoMapper::toDto)
                .toList();
    }

    @Transactional
    public ProdutoResponseDto create(ProdutoCreateDto dto) {
        Long     clienteId = securityUtils.getClienteIdLogado();
        Cliente  cliente   = clienteService.findById(clienteId);
        Usuario  usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        Produto produto = new Produto();
        produto.setCliente(cliente);
        produto.setCreatedBy(usuario);

        preencherCampos(produto, dto.codigo(), dto.codigoEan(), dto.codigoGtin(),
                dto.nome(), dto.descricao(), null,
                dto.tipoProdutoId(), dto.subgrupoId(), dto.categoriaId(), dto.marcaId(),
                dto.unidadeMedidaId(), dto.fornecedorPessoaId(), clienteId,
                dto.custo(), dto.ncmId(), dto.origemProdutoId(), dto.cestId(),
                dto.substituicaoTributaria());

        return produtoMapper.toDto(produtoRepository.save(produto));
    }

    @Transactional
    public ProdutoResponseDto update(Long id, ProdutoUpdateDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Produto produto   = findById(id);
        Usuario usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        produto.setUpdatedBy(usuario);

        preencherCampos(produto, dto.codigo(), dto.codigoEan(), dto.codigoGtin(),
                dto.nome(), dto.descricao(), dto.bloqueado(),
                dto.tipoProdutoId(), dto.subgrupoId(), dto.categoriaId(), dto.marcaId(),
                dto.unidadeMedidaId(), dto.fornecedorPessoaId(), clienteId,
                dto.custo(), dto.ncmId(), dto.origemProdutoId(), dto.cestId(),
                dto.substituicaoTributaria());

        return produtoMapper.toDto(produtoRepository.save(produto));
    }

    @Transactional
    public void delete(Long id) {
        produtoRepository.delete(findById(id));
    }

    private void preencherCampos(
            Produto produto,
            Integer codigo,
            String  codigoEan,
            String  codigoGtin,
            String  nome,
            String  descricao,
            Boolean bloqueado,
            Long    tipoProdutoId,
            Long    subgrupoId,
            Long    categoriaId,
            Long    marcaId,
            Long    unidadeMedidaId,
            Long    fornecedorPessoaId,
            Long    clienteId,
            java.math.BigDecimal custo,
            Long    ncmId,
            Long    origemProdutoId,
            Long    cestId,
            Boolean substituicaoTributaria
    ) {
        TipoProduto   tipoProduto   = tipoProdutoService.findById(tipoProdutoId);
        UnidadeMedida unidadeMedida = unidadeMedidaService.findById(unidadeMedidaId);

        Subgrupo    subgrupo    = subgrupoId    != null ? subgrupoService.findById(subgrupoId)        : null;
        Categoria   categoria   = categoriaId   != null ? categoriaService.findById(categoriaId)     : null;
        Marca       marca       = marcaId       != null ? marcaService.findById(marcaId)             : null;
        Ncm         ncm         = ncmId         != null ? ncmService.findById(ncmId)                 : null;
        OrigemProduto origem     = origemProdutoId != null ? origemProdutoService.findById(origemProdutoId) : null;
        Cest        cest        = cestId        != null ? cestService.findById(cestId)               : null;

        Pessoa fornecedor = null;
        if (fornecedorPessoaId != null) {
            fornecedor = pessoaRepository.findByIdAndClienteId(fornecedorPessoaId, clienteId)
                    .orElseThrow(() -> new NotFoundException("Fornecedor não encontrado"));
        }

        produto.setCodigo(codigo);
        produto.setCodigoEan(codigoEan);
        produto.setCodigoGtin(codigoGtin);
        produto.setNome(nome);
        produto.setDescricao(descricao);
        if (bloqueado != null) produto.setBloqueado(bloqueado);
        produto.setTipoProduto(tipoProduto);
        produto.setSubgrupo(subgrupo);
        produto.setCategoria(categoria);
        produto.setMarca(marca);
        produto.setUnidadeMedida(unidadeMedida);
        produto.setFornecedorPessoa(fornecedor);
        produto.setCusto(custo);
        produto.setNcm(ncm);
        produto.setOrigemProduto(origem);
        produto.setCest(cest);
        if (substituicaoTributaria != null) produto.setSubstituicaoTributaria(substituicaoTributaria);
    }
}
