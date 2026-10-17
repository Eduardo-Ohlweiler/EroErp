package com.api.ero_erp.servico.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Uma linha de "Valores por filial". A filial é a chave da linha: cada uma
 * entra uma vez só.
 *
 * @param valor opcional; {@code null} fica gravado como não informado
 */
public record ServicoFilialItemDto(
        @NotNull(message = "Filial é obrigatória")
        UUID filialId,

        @DecimalMin(value = "0.00", message = "Valor não pode ser negativo")
        @Digits(integer = 13, fraction = 2, message = "Valor aceita até 13 dígitos e 2 casas decimais")
        BigDecimal valor
) {}
