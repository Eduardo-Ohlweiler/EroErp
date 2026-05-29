package com.api.ero_erp.whatsapp.whatsappinstancia.mapper;

import com.api.ero_erp.whatsapp.whatsappinstancia.dtos.WhatsappInstanciaResponseDto;
import com.api.ero_erp.whatsapp.whatsappinstancia.entity.WhatsappInstancia;

public class WhatsappInstanciaMapper {

    private WhatsappInstanciaMapper() {}

    public static WhatsappInstanciaResponseDto toDto(WhatsappInstancia entity) {
        if (entity == null) return null;

        return new WhatsappInstanciaResponseDto(
                entity.getId(),
                entity.getCliente() != null ? entity.getCliente().getId() : null,
                entity.getNome(),
                entity.getInstanceName(),
                entity.getToken(),
                entity.getTimezone(),
                entity.getAntecedenciaMinutos(),
                entity.getAtivo(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
