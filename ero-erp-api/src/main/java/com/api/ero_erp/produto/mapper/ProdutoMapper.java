package com.api.ero_erp.produto.mapper;

import com.api.ero_erp.produto.dtos.ProdutoResponseDto;
import com.api.ero_erp.produto.entity.Produto;
import org.springframework.stereotype.Component;

@Component
public class ProdutoMapper {

    public ProdutoResponseDto toDto(Produto p) {
        return new ProdutoResponseDto(
                p.getId(),
                p.getCliente().getId(),
                p.getCodigo(),
                p.getCodigoEan(),
                p.getCodigoGtin(),
                p.getNome(),
                p.getDescricao(),
                p.getBloqueado(),

                p.getTipoProduto().getId(),
                p.getTipoProduto().getNome(),

                p.getSubgrupo()   != null ? p.getSubgrupo().getId()   : null,
                p.getSubgrupo()   != null ? p.getSubgrupo().getNome() : null,
                p.getSubgrupo()   != null ? p.getSubgrupo().getGrupo().getNome() : null,

                p.getCategoria()  != null ? p.getCategoria().getId()   : null,
                p.getCategoria()  != null ? p.getCategoria().getNome() : null,

                p.getMarca()      != null ? p.getMarca().getId()   : null,
                p.getMarca()      != null ? p.getMarca().getNome() : null,

                p.getUnidadeMedida().getId(),
                p.getUnidadeMedida().getSigla(),

                p.getFornecedorPessoa() != null ? p.getFornecedorPessoa().getId()   : null,
                p.getFornecedorPessoa() != null ? p.getFornecedorPessoa().getNome() : null,

                p.getCusto(),

                p.getNcm()           != null ? p.getNcm().getId()           : null,
                p.getNcm()           != null ? p.getNcm().getCodigo()       : null,

                p.getOrigemProduto() != null ? p.getOrigemProduto().getId()     : null,
                p.getOrigemProduto() != null ? p.getOrigemProduto().getCodigo() : null,

                p.getCest()          != null ? p.getCest().getId()     : null,
                p.getCest()          != null ? p.getCest().getCodigo() : null,

                p.getSubstituicaoTributaria(),
                p.getBaixarEstoque(),

                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
