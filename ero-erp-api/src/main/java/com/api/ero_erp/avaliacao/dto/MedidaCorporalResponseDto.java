package com.api.ero_erp.avaliacao.dto;

import com.api.ero_erp.avaliacao.enums.PontoMedicao;

import java.math.BigDecimal;

public record MedidaCorporalResponseDto(
        Long         id,
        PontoMedicao pontoMedicao,
        BigDecimal   valorCm
) {}
