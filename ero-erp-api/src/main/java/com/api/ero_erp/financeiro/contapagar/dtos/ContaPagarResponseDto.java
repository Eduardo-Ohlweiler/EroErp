package com.api.ero_erp.financeiro.contapagar.dtos;

import java.math.BigDecimal;
import java.util.List;

public record ContaPagarResponseDto(
        Long   id,
        Long   emitenteId,
        String emitenteNome,
        String emitenteDocumento,
        Long   pessoaId,
        String pessoaNome,
        String pessoaDocumento,
        String data,
        String descricao,
        BigDecimal valorTotal,
        String status,
        String observacao,
        Boolean ativo,
        List<ParcelaContaPagarResponseDto> parcelas,
        String createdAt,
        String updatedAt
) {}
