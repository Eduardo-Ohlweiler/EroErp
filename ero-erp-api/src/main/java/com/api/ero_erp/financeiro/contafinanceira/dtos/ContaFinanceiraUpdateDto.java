package com.api.ero_erp.financeiro.contafinanceira.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

public record ContaFinanceiraUpdateDto(

        @Schema(description = "Nome do banco ou caixa físico", example = "Itaú")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @Schema(description = "Define se a conta está ativa", example = "true")
        Boolean ativo
) {}
