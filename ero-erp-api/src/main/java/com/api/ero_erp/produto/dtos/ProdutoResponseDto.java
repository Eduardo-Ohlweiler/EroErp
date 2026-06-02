package com.api.ero_erp.produto.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProdutoResponseDto(
        Long          id,
        Long          clienteId,
        Integer       codigo,
        String        codigoEan,
        String        codigoGtin,
        String        nome,
        String        descricao,
        Boolean       bloqueado,

        Long          tipoProdutoId,
        String        tipoProdutoNome,

        Long          subgrupoId,
        String        subgrupoNome,

        Long          categoriaId,
        String        categoriaNome,

        Long          marcaId,
        String        marcaNome,

        Long          unidadeMedidaId,
        String        unidadeMedidaSigla,

        Long          fornecedorPessoaId,
        String        fornecedorNome,

        BigDecimal    custo,

        Long          ncmId,
        String        ncmCodigo,

        Long          origemProdutoId,
        String        origemProdutoCodigo,

        Long          cestId,
        String        cestCodigo,

        Boolean       substituicaoTributaria,

        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
