package com.api.ero_erp.estoque.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Entrada manual: soma ao saldo. */
public record EntradaDto(
        @NotNull(message = "Quantidade é obrigatória")
        @DecimalMin(value = "0.001", message = "A quantidade da entrada tem de ser maior que zero")
        @Digits(integer = 12, fraction = 3, message = "Quantidade aceita até 12 dígitos e 3 casas decimais")
        BigDecimal quantidade,

        @Size(max = 255, message = "Motivo aceita até 255 caracteres")
        String motivo
) {}
