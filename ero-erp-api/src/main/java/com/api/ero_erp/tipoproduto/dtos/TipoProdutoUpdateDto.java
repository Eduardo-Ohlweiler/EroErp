package com.api.ero_erp.tipoproduto.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record TipoProdutoUpdateDto(

        @NotBlank(message = "Classificação é obrigatória")
        @Pattern(regexp = "PRODUTO|SERVICO", message = "Classificação deve ser PRODUTO ou SERVICO")
        String classificacao
) {}
