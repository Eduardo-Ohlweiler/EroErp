package com.api.ero_erp.financeiro.contafinanceira.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContaFinanceiraCreateDto(

        @Schema(description = "Nome do banco ou caixa físico", example = "Sicredi")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @Schema(description = "Define se a conta está ativa", example = "true")
        Boolean ativo
) {}
