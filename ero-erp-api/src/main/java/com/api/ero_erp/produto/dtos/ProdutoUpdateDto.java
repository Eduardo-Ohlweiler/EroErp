package com.api.ero_erp.produto.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProdutoUpdateDto(

        @Schema(description = "Código interno do produto", example = "1001")
        Integer codigo,

        @Schema(description = "Código EAN-13", example = "7891234567890")
        @Size(max = 14, message = "Código EAN deve ter no máximo 14 caracteres")
        String codigoEan,

        @Schema(description = "Código GTIN-14", example = "07891234567890")
        @Size(max = 14, message = "Código GTIN deve ter no máximo 14 caracteres")
        String codigoGtin,

        @Schema(description = "Nome do produto", example = "Água Mineral 500ml")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @Schema(description = "Descrição do produto", example = "Água mineral natural sem gás")
        @Size(max = 255, message = "Descrição deve ter no máximo 255 caracteres")
        String descricao,

        @Schema(description = "Produto bloqueado", example = "false")
        @NotNull(message = "Bloqueado é obrigatório")
        Boolean bloqueado,

        @Schema(description = "ID do tipo de produto", example = "1")
        @NotNull(message = "Tipo de produto é obrigatório")
        Long tipoProdutoId,

        @Schema(description = "ID do subgrupo", example = "1")
        Long subgrupoId,

        @Schema(description = "ID da categoria", example = "1")
        Long categoriaId,

        @Schema(description = "ID da marca", example = "1")
        Long marcaId,

        @Schema(description = "ID da unidade de medida", example = "1")
        @NotNull(message = "Unidade de medida é obrigatória")
        Long unidadeMedidaId,

        @Schema(description = "ID da pessoa fornecedora", example = "1")
        Long fornecedorPessoaId,

        @Schema(description = "Custo do produto", example = "2.50")
        BigDecimal custo,

        @Schema(description = "ID do NCM", example = "1")
        Long ncmId,

        @Schema(description = "ID da origem do produto", example = "1")
        Long origemProdutoId,

        @Schema(description = "ID do CEST", example = "1")
        Long cestId,

        @Schema(description = "Indica substituição tributária", example = "false")
        Boolean substituicaoTributaria
) {}
