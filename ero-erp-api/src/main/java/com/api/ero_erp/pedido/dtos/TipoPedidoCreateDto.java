package com.api.ero_erp.pedido.dtos;

import com.api.ero_erp.pedido.enums.GeraFinanceiro;
import com.api.ero_erp.pedido.enums.MovimentaEstoque;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TipoPedidoCreateDto(

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @NotNull(message = "Movimentação de estoque é obrigatória")
        MovimentaEstoque movimentaEstoque,

        @NotNull(message = "Geração de financeiro é obrigatória")
        GeraFinanceiro geraFinanceiro,

        Boolean ativo
) {}
