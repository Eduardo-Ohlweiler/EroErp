package com.api.ero_erp.whatsapp.whatsappconfigglobal.mapper;

import com.api.ero_erp.whatsapp.whatsappconfigglobal.dtos.WhatsappConfigGlobalResponseDto;
import com.api.ero_erp.whatsapp.whatsappconfigglobal.entity.WhatsappConfigGlobal;

public class WhatsappConfigGlobalMapper {

    private WhatsappConfigGlobalMapper() {}

    public static WhatsappConfigGlobalResponseDto toDto(WhatsappConfigGlobal entity) {
        if (entity == null) return null;

        return new WhatsappConfigGlobalResponseDto(
                entity.getId(),
                entity.getApiUrl(),
                entity.getApiKey(),
                entity.getAtivo(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
