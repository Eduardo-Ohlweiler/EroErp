package com.api.ero_erp.estoque.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * O cadastro da linha. Não toca na quantidade — essa só muda por
 * movimentação — e {@code ativo} tem rota própria. Todos os campos vêm
 * sempre: nulo grava nulo. O antigo sobrescrevia a quantidade mínima com o
 * nulo de quem mandava só o bloqueio, e o alerta sumia.
 */
public record EstoqueUpdateDto(
        @DecimalMin(value = "0.00", message = "Preço de venda não pode ser negativo")
        @Digits(integer = 13, fraction = 2, message = "Preço de venda aceita até 13 dígitos e 2 casas decimais")
        BigDecimal precoVenda,

        @NotNull(message = "Informe se controla estoque")
        Boolean controlaEstoque,

        @DecimalMin(value = "0.000", message = "Quantidade mínima não pode ser negativa")
        @Digits(integer = 12, fraction = 3, message = "Quantidade mínima aceita até 12 dígitos e 3 casas decimais")
        BigDecimal quantidadeMinima
) {}
