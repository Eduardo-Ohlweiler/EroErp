package com.api.ero_erp.consulta.dtos;

import com.api.ero_erp.consulta.enums.TipoAjuste;
import com.api.ero_erp.consulta.enums.TipoCalculo;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Um produto da consulta, como a tela o manda. O estoque só baixa ao
 * concluir.
 *
 * @param precoUnitario nulo usa o preço de venda do estoque na filial do
 *                      compromisso (num item já gravado, o que ele tinha)
 */
public record ConsultaProdutoItemDto(
        UUID id,

        @NotNull(message = "Escolha o produto")
        UUID produtoId,

        @NotNull(message = "Informe a quantidade do produto")
        @DecimalMin(value = "0", inclusive = false, message = "A quantidade do produto tem de ser maior que zero")
        @Digits(integer = 12, fraction = 3, message = "Quantidade com até 3 casas")
        BigDecimal quantidade,

        @DecimalMin(value = "0.00", message = "O preço não pode ser negativo")
        @Digits(integer = 13, fraction = 2, message = "Preço com até 2 casas")
        BigDecimal precoUnitario,

        TipoAjuste tipoAjuste,

        TipoCalculo tipoCalculo,

        @Digits(integer = 13, fraction = 2, message = "Ajuste com até 2 casas")
        BigDecimal valorAjuste
) {}
