package com.api.ero_erp.financeiro.contapagar.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record ContaPagarCreateDto(
        Long emitenteId,

        @NotNull(message = "Pessoa é obrigatória")
        Long pessoaId,

        @NotBlank(message = "Data é obrigatória")
        String data,

        String descricao,

        @NotNull(message = "Valor total é obrigatório")
        BigDecimal valorTotal,

        String observacao,

        @NotEmpty(message = "É necessário ao menos uma parcela")
        @Valid
        List<ParcelaContaPagarCreateDto> parcelas
) {}
