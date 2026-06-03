package com.api.ero_erp.estoque.dtos;

import com.api.ero_erp.estoque.enums.TipoMovimentacao;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MovimentacaoResponseDto(
        Long               id,
        Long               clienteId,

        Long               estoqueId,
        Long               emitenteId,
        String             emitenteNome,

        Long               produtoId,
        String             produtoNome,

        TipoMovimentacao   tipo,
        BigDecimal         quantidade,
        BigDecimal         quantidadeAnterior,
        BigDecimal         quantidadePosterior,

        String             motivo,
        Long               transferenciaId,

        String             createdByNome,
        LocalDateTime      createdAt
) {}
