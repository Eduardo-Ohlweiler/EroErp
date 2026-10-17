package com.api.ero_erp.estoque.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Leva saldo de uma filial a outra. A filial de destino que ainda não tem
 * estoque do produto ganha a linha, com controle e sem preço.
 */
public record TransferenciaDto(
        @NotNull(message = "Produto é obrigatório")
        UUID produtoId,

        @NotNull(message = "Filial de origem é obrigatória")
        UUID filialOrigemId,

        @NotNull(message = "Filial de destino é obrigatória")
        UUID filialDestinoId,

        @NotNull(message = "Quantidade é obrigatória")
        @DecimalMin(value = "0.001", message = "A quantidade da transferência tem de ser maior que zero")
        @Digits(integer = 12, fraction = 3, message = "Quantidade aceita até 12 dígitos e 3 casas decimais")
        BigDecimal quantidade,

        @Size(max = 255, message = "Motivo aceita até 255 caracteres")
        String motivo
) {}
