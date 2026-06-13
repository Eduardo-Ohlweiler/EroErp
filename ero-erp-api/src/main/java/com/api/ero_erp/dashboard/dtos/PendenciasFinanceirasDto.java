package com.api.ero_erp.dashboard.dtos;

import java.util.List;

public record PendenciasFinanceirasDto(
        List<PendenciaItemDto> contasPagar,
        List<PendenciaItemDto> contasReceber
) {}
