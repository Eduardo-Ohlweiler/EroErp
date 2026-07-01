package com.api.ero_erp.crm.configuracaocrm.dtos;

public record CrmQrCodeResponseDto(
        String base64,
        String pairingCode,
        String status
) {}
