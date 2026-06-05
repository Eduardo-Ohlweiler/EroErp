package com.api.ero_erp.financeiro.formapagamento.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FormaPagamentoCreateDto(

        @Schema(description = "Nome da forma de pagamento", example = "Débito Itaú")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @Schema(description = "ID do tipo de cobrança", example = "1")
        @NotNull(message = "Tipo de cobrança é obrigatório")
        Long tipoCobrancaId,

        @Schema(description = "ID da conta financeira", example = "1")
        @NotNull(message = "Conta financeira é obrigatória")
        Long contaFinanceiraId,

        @Schema(description = "Define se a forma de pagamento está ativa", example = "true")
        Boolean ativo
) {}
