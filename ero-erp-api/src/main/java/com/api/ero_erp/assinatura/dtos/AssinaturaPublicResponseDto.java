package com.api.ero_erp.assinatura.dtos;

import com.api.ero_erp.assinatura.entity.AssinaturaStatus;

public record AssinaturaPublicResponseDto(
        String           nomeDocumento,
        String           nomeCliente,
        AssinaturaStatus status
) {}
