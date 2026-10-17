package com.api.ero_erp.estoque.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Abre o estoque de um produto numa filial. Produto e filial não mudam
 * depois: são a identidade da linha.
 *
 * @param precoVenda        opcional; {@code null} fica como não informado
 * @param quantidadeMinima  opcional; só guardado, sem alerta por enquanto
 * @param quantidadeInicial opcional; maior que zero vira uma ENTRADA
 *                          "Saldo inicial" — só com controle de estoque
 */
public record EstoqueCreateDto(
        @NotNull(message = "Produto é obrigatório")
        UUID produtoId,

        @NotNull(message = "Filial é obrigatória")
        UUID filialId,

        @DecimalMin(value = "0.00", message = "Preço de venda não pode ser negativo")
        @Digits(integer = 13, fraction = 2, message = "Preço de venda aceita até 13 dígitos e 2 casas decimais")
        BigDecimal precoVenda,

        @NotNull(message = "Informe se controla estoque")
        Boolean controlaEstoque,

        @DecimalMin(value = "0.000", message = "Quantidade mínima não pode ser negativa")
        @Digits(integer = 12, fraction = 3, message = "Quantidade mínima aceita até 12 dígitos e 3 casas decimais")
        BigDecimal quantidadeMinima,

        @DecimalMin(value = "0.000", message = "Quantidade inicial não pode ser negativa")
        @Digits(integer = 12, fraction = 3, message = "Quantidade inicial aceita até 12 dígitos e 3 casas decimais")
        BigDecimal quantidadeInicial
) {}
