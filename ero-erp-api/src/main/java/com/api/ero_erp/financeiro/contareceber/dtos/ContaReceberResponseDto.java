package com.api.ero_erp.financeiro.contareceber.dtos;

import java.math.BigDecimal;
import java.util.List;

public record ContaReceberResponseDto(
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
        List<ParcelaContaReceberResponseDto> parcelas,
        String createdAt,
        String updatedAt
) {}
