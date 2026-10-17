package com.api.ero_erp.estoque.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Ajuste: quem contou diz quanto há. O movimento grava a diferença com o
 * sinal dela. O motivo é obrigatório — ajuste sem explicação é o primeiro
 * número que ninguém sabe defender.
 */
public record AjusteDto(
        @NotNull(message = "Quantidade nova é obrigatória")
        @DecimalMin(value = "0.000", message = "A quantidade nova não pode ser negativa")
        @Digits(integer = 12, fraction = 3, message = "Quantidade aceita até 12 dígitos e 3 casas decimais")
        BigDecimal quantidadeNova,

        @NotBlank(message = "Informe o motivo do ajuste")
        @Size(max = 255, message = "Motivo aceita até 255 caracteres")
        String motivo
) {}
