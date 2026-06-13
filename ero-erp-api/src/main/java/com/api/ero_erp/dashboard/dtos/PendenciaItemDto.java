package com.api.ero_erp.dashboard.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PendenciaItemDto(
        Long parcelaId,
        Long contaId,
        Long pessoaId,
        String pessoaNome,
        Long emitenteId,
        String emitenteNome,
        String descricao,
        Integer numeroParcela,
        LocalDate dataVencimento,
        BigDecimal valor,
        boolean vencida,
        long diasAtraso
) {}
