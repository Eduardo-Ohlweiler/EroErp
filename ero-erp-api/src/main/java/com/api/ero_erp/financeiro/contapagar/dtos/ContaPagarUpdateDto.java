package com.api.ero_erp.financeiro.contapagar.dtos;

import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.util.List;

public record ContaPagarUpdateDto(
        Long emitenteId,
        Long pessoaId,
        String data,
        String descricao,
        BigDecimal valorTotal,
        String status,
        String observacao,
        Boolean ativo,
        @Valid
        List<ParcelaContaPagarCreateDto> parcelas
) {}
