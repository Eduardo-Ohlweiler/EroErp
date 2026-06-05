package com.api.ero_erp.financeiro.formapagamento.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

public record FormaPagamentoUpdateDto(

        @Schema(description = "Nome da forma de pagamento", example = "Crédito Sicredi")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @Schema(description = "ID do tipo de cobrança", example = "2")
        Long tipoCobrancaId,

        @Schema(description = "ID da conta financeira", example = "2")
        Long contaFinanceiraId,

        @Schema(description = "Define se a forma de pagamento está ativa", example = "true")
        Boolean ativo
) {}
