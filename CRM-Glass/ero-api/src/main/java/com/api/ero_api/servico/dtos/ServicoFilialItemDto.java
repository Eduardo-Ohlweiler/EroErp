package com.api.ero_api.servico.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Filial onde o serviço é prestado, na entrada do serviço. Sem {@code id}: a lista que
 * chega é o estado completo e substitui a anterior (a filial é a chave da linha).
 */
@Schema(description = "Filial onde o serviço é prestado e o preço nela")
public record ServicoFilialItemDto(

        @Schema(description = "Id da filial (/api/filiais/selecao); ativa, ou já gravada neste serviço")
        @NotNull(message = "Escolha a filial")
        UUID filialId,

        @Schema(description = "Preço nesta filial. Vazio = não informado (digitado no movimento); 0 = gratuito",
                example = "150.00")
        @DecimalMin(value = "0.00", message = "Preço não pode ser negativo")
        @Digits(integer = 13, fraction = 2, message = "Preço aceita até 13 dígitos e 2 casas decimais")
        BigDecimal valor) {
}
