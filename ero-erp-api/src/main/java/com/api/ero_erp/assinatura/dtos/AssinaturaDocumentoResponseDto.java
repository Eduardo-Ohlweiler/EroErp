package com.api.ero_erp.assinatura.dtos;

import com.api.ero_erp.assinatura.entity.AssinaturaStatus;
import java.time.LocalDateTime;

public record AssinaturaDocumentoResponseDto(
        Long             id,
        Long             documentoId,
        String           token,
        AssinaturaStatus status,
        String           dadosAssinatura,
        String           ipAssinante,
        LocalDateTime    dataAssinatura
) {}
