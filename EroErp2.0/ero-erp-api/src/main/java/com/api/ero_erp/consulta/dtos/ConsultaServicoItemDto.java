package com.api.ero_erp.consulta.dtos;

import com.api.ero_erp.consulta.enums.TipoAjuste;
import com.api.ero_erp.consulta.enums.TipoCalculo;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Um serviço da consulta, como a tela o manda.
 *
 * @param id            o item já gravado, para manter o retrato da descrição;
 *                      nulo é item novo
 * @param precoUnitario nulo usa o valor do serviço na filial do compromisso
 *                      (num item já gravado, o preço que ele tinha)
 */
public record ConsultaServicoItemDto(
        UUID id,

        @NotNull(message = "Escolha o serviço")
        UUID servicoId,

        @NotNull(message = "Informe a quantidade do serviço")
        @Min(value = 1, message = "A quantidade do serviço é de 1 a 9999")
        @Max(value = 9999, message = "A quantidade do serviço é de 1 a 9999")
        Integer quantidade,

        @DecimalMin(value = "0.00", message = "O preço não pode ser negativo")
        @Digits(integer = 13, fraction = 2, message = "Preço com até 2 casas")
        BigDecimal precoUnitario,

        TipoAjuste tipoAjuste,

        TipoCalculo tipoCalculo,

        @Digits(integer = 13, fraction = 2, message = "Ajuste com até 2 casas")
        BigDecimal valorAjuste
) {}
