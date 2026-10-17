package com.api.ero_erp.produto.mapper;

import com.api.ero_erp.auxiliarproduto.entity.CategoriaProduto;
import com.api.ero_erp.auxiliarproduto.entity.MarcaProduto;
import com.api.ero_erp.auxiliarproduto.entity.SubgrupoProduto;
import com.api.ero_erp.catalogo.entity.UnidadeMedida;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.produto.dtos.ProdutoResponseDto;
import com.api.ero_erp.produto.dtos.ProdutoSelectDto;
import com.api.ero_erp.produto.entity.Produto;

/**
 * Toca unidade, subgrupo com grupo, categoria, marca e fornecedor: quem chama
 * tem de tê-los buscado junto ({@code ProdutoRepository.findAllCompletos}) —
 * o antigo não buscava o grupo nem o fornecedor, e cada linha disparava
 * consultas extras.
 */
public final class ProdutoMapper {

    private ProdutoMapper() {}

    public static ProdutoResponseDto toResponse(Produto p) {
        UnidadeMedida unidade = p.getUnidadeMedida();
        SubgrupoProduto subgrupo = p.getSubgrupo();
        CategoriaProduto categoria = p.getCategoria();
        MarcaProduto marca = p.getMarca();
        Pessoa fornecedor = p.getFornecedor();
        return new ProdutoResponseDto(
                p.getId(),
                p.getCodigo(),
                p.getNome(),
                p.getDescricao(),
                p.getEan(),
                unidade.getId(),
                unidade.getSigla(),
                unidade.getDescricao(),
                subgrupo != null ? subgrupo.getGrupo().getId() : null,
                subgrupo != null ? subgrupo.getGrupo().getNome() : null,
                subgrupo != null ? subgrupo.getId() : null,
                subgrupo != null ? subgrupo.getNome() : null,
                categoria != null ? categoria.getId() : null,
                categoria != null ? categoria.getNome() : null,
                marca != null ? marca.getId() : null,
                marca != null ? marca.getNome() : null,
                fornecedor != null ? fornecedor.getId() : null,
                fornecedor != null ? fornecedor.getNome() : null,
                p.getCusto(),
                p.getAtivo(),
                p.getCreatedAt(),
                p.getUpdatedAt());
    }

    public static ProdutoSelectDto toSelect(Produto p) {
        return new ProdutoSelectDto(p.getId(), p.getCodigo(), p.getNome(), p.getUnidadeMedida().getSigla());
    }
}
